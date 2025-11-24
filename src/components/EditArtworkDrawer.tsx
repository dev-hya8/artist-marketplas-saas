import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Upload, Crop, X } from "lucide-react";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { ImageCropperDialog } from "@/components/ImageCropperDialog";
import { useCurrency, CURRENCIES } from "@/contexts/CurrencyContext";
import { compressImage } from "@/lib/imageUtils";
import type { Tables, Database } from "@/integrations/supabase/types";

type Artwork = Tables<"artworks">;
type ArtworkStatus = Database["public"]["Enums"]["artwork_status"];

interface EditArtworkDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artwork: Artwork;
  onSuccess: () => void;
  onClose: () => void;
}

export const EditArtworkDrawer = ({
  open,
  onOpenChange,
  artwork,
  onSuccess,
  onClose,
}: EditArtworkDrawerProps) => {
  const { toast } = useToast();
  const { convertPrice, currencyCode, isRateFailed } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  const [dimensionUnitWarning, setDimensionUnitWarning] = useState(false);
  const [galleryHasChanges, setGalleryHasChanges] = useState(false);
  const [distinctMedia, setDistinctMedia] = useState<string[]>([]);
  const [distinctLocations, setDistinctLocations] = useState<string[]>([]);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  
  // Function to check if dimensions contain unit keywords
  const checkForUnits = (text: string): boolean => {
    const unitKeywords = /\b(in|inch|inches|cm|ft|feet)\b/i;
    return unitKeywords.test(text);
  };
  
  const [formData, setFormData] = useState({
    title: artwork.title,
    image_url: artwork.image_url || "",
    creation_year: artwork.creation_year?.toString() || "",
    medium: artwork.medium || "",
    dimensions: artwork.dimensions || "",
    dimension_unit: artwork.dimension_unit || "in",
    depth: artwork.depth?.toString() || "",
    status: artwork.status,
    price: artwork.price?.toString() || "",
    base_currency: artwork.base_currency || "USD",
    location: artwork.location || "",
    provenance_log: artwork.provenance_log || "",
  });

  useEffect(() => {
    setFormData({
      title: artwork.title,
      image_url: artwork.image_url || "",
      creation_year: artwork.creation_year?.toString() || "",
      medium: artwork.medium || "",
      dimensions: artwork.dimensions || "",
      dimension_unit: artwork.dimension_unit || "in",
      depth: artwork.depth?.toString() || "",
      status: artwork.status,
      price: artwork.price?.toString() || "",
      base_currency: artwork.base_currency || "USD",
      location: artwork.location || "",
      provenance_log: artwork.provenance_log || "",
    });
    setGalleryHasChanges(false);
    fetchAutocompleteData();
  }, [artwork.id]);

  const fetchAutocompleteData = async () => {
    try {
      const { data, error } = await supabase
        .from("artworks")
        .select("medium, location");

      if (error) throw error;
      
      if (data) {
        const media = [...new Set(data.map(item => item.medium).filter(Boolean))] as string[];
        const locations = [...new Set(data.map(item => item.location).filter(Boolean))] as string[];
        setDistinctMedia(media);
        setDistinctLocations(locations);
      }
    } catch (error) {
      console.error("Error fetching autocomplete data:", error);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    // Create preview URL and open cropper
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImageUrl(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);

    e.target.value = ""; // Reset file input
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    console.log("handleCropComplete called with blob:", croppedBlob.size, "bytes");
    setCroppedBlob(croppedBlob);
    setUploading(true);

    try {
      // Convert Blob to File for compression and upload
      const croppedFile = new File([croppedBlob], `cropped_${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });

      // Compress the image before upload (max 2MB)
      console.log("🗜️ Compressing image before upload...");
      const compressedFile = await compressImage(croppedFile, 2);

      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.jpg`;
      const filePath = fileName;

      console.log("📤 Uploading compressed file:", fileName);

      const { error: uploadError } = await supabase.storage
        .from('artwork_images')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('artwork_images')
        .getPublicUrl(filePath);

      // Attempt to delete old image if replacing
      if (artwork.image_url) {
        try {
          const urlParts = artwork.image_url.split('/');
          const oldFileName = urlParts[urlParts.length - 1].split('?')[0]; // Remove any query params
          
          const { error: deleteError } = await supabase.storage
            .from('artwork_images')
            .remove([oldFileName]);

          if (deleteError) {
            console.warn("Could not delete old image:", deleteError);
          }
        } catch (deleteError) {
          console.warn("Error deleting old image:", deleteError);
        }
      }

      // Add timestamp to prevent caching
      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;
      
      console.log("Setting image URL:", urlWithTimestamp);
      setFormData({ ...formData, image_url: urlWithTimestamp });
      
      toast({
        title: "Success",
        description: "Cropped thumbnail updated successfully",
      });
    } catch (error: any) {
      console.error("Thumbnail upload error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload cropped thumbnail",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRecrop = () => {
    if (formData.image_url) {
      setTempImageUrl(formData.image_url);
      setCropperOpen(true);
    }
  };

  // Logic to remove the main thumbnail from the UI (will be saved as null on update)
  const handleRemoveThumbnail = () => {
    setFormData({ ...formData, image_url: "" });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("artworks")
        .update({
          title: formData.title,
          image_url: formData.image_url || null,
          creation_year: formData.creation_year ? parseInt(formData.creation_year) : null,
          medium: formData.medium || null,
          dimensions: formData.dimensions || null,
          dimension_unit: formData.dimension_unit,
          depth: formData.depth ? parseFloat(formData.depth) : null,
          status: formData.status,
          price: formData.price ? parseFloat(formData.price) : null,
          base_currency: formData.base_currency,
          location: formData.location || null,
          provenance_log: formData.provenance_log || null,
        })
        .eq("id", artwork.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Artwork updated successfully",
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setLoading(true);

    try {
      if (artwork.image_url) {
        try {
          const urlParts = artwork.image_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          
          const { error: storageError } = await supabase.storage
            .from('artwork_images')
            .remove([fileName]);

          if (storageError) {
            console.error("Storage deletion error:", storageError);
          }
        } catch (storageError: any) {
          console.error("Storage deletion error:", storageError);
        }
      }

      const { error: dbError } = await supabase
        .from("artworks")
        .delete()
        .eq("id", artwork.id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Artwork deleted successfully",
      });
      
      setShowDeleteDialog(false);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Artwork deletion error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete artwork",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check for changes to enable/disable the update button
  const hasChanges = 
    formData.title !== artwork.title ||
    formData.image_url !== (artwork.image_url || "") ||
    formData.creation_year !== (artwork.creation_year?.toString() || "") ||
    formData.medium !== (artwork.medium || "") ||
    formData.dimensions !== (artwork.dimensions || "") ||
    formData.dimension_unit !== (artwork.dimension_unit || "in") ||
    formData.depth !== (artwork.depth?.toString() || "") ||
    formData.status !== artwork.status ||
    formData.price !== (artwork.price?.toString() || "") ||
    formData.base_currency !== (artwork.base_currency || "USD") ||
    formData.location !== (artwork.location || "") ||
    formData.provenance_log !== (artwork.provenance_log || "") ||
    galleryHasChanges;

  // Handle close attempt with unsaved changes check
  const handleAttemptClose = () => {
    if (hasChanges) {
      setShowUnsavedAlert(true);
    } else {
      onClose();
    }
  };

  const handleSaveAndClose = async () => {
    await handleUpdate(new Event('submit') as any);
    setShowUnsavedAlert(false);
  };

  const handleDiscardAndClose = () => {
    setShowUnsavedAlert(false);
    onClose();
  };

  return (
    <>
      <Drawer open={open} onOpenChange={(open) => !open && handleAttemptClose()}>
        <DrawerContent>
          <DrawerHeader className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-8 w-8"
              onClick={handleAttemptClose}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
            <DrawerTitle>Edit Artwork</DrawerTitle>
            <DrawerDescription>Update the details of your artwork</DrawerDescription>
          </DrawerHeader>
          <form onSubmit={handleUpdate} className="px-4 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* MAIN IMAGE UPLOAD */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Main Thumbnail</Label>
              
              {formData.image_url && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-muted group">
                  <img 
                    src={formData.image_url} 
                    alt={formData.title}
                    className="w-full h-full object-contain"
                  />
                  {/* Added Remove and Recrop Buttons for Main Thumbnail */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      type="button"
                      onClick={handleRecrop}
                      className="p-1.5 bg-white/80 rounded-full hover:bg-blue-100 transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Recrop Thumbnail"
                    >
                      <Crop className="w-4 h-4 text-blue-500" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveThumbnail}
                      className="p-1.5 bg-white/80 rounded-full hover:bg-red-100 transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Remove Thumbnail"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Input
                  id="edit-thumbnail-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('edit-thumbnail-upload')?.click()}
                  disabled={uploading}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Uploading..." : formData.image_url ? "Change Thumbnail" : "Upload Thumbnail"}
                </Button>
              </div>
              
              {uploading && (
                <p className="text-sm text-muted-foreground">Uploading and replacing image...</p>
              )}
            </div>

            {/* SECTION 1: THE OBJECT (TOMBSTONE DATA) */}
            <div className="space-y-4 pt-2 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground">Artwork Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-creation_year">Creation Year</Label>
                <Input
                  id="edit-creation_year"
                  type="number"
                  min="1000"
                  max="2100"
                  placeholder="e.g., 2024"
                  value={formData.creation_year}
                  onChange={(e) => setFormData({ ...formData, creation_year: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-medium">Medium</Label>
                <Input
                  id="edit-medium"
                  list="edit-medium-suggestions"
                  placeholder="e.g., Oil on canvas"
                  value={formData.medium}
                  onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                />
                <datalist id="edit-medium-suggestions">
                  {distinctMedia.map((medium) => (
                    <option key={medium} value={medium} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-dimensions">Dimensions (H x W)</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-dimensions"
                    placeholder="e.g. 24 x 36 (Enter numbers only)"
                    value={formData.dimensions}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, dimensions: value });
                      setDimensionUnitWarning(checkForUnits(value));
                    }}
                    className="flex-1"
                  />
                  <Select
                    value={formData.dimension_unit}
                    onValueChange={(value) => setFormData({ ...formData, dimension_unit: value })}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cm">cm</SelectItem>
                      <SelectItem value="in">in</SelectItem>
                      <SelectItem value="ft">ft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {dimensionUnitWarning && (
                  <p className="text-sm text-amber-600 dark:text-amber-500">
                    ⚠️ Please select the unit from the dropdown instead of typing it.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-depth">Depth (optional)</Label>
                <Input
                  id="edit-depth"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 2"
                  value={formData.depth}
                  onChange={(e) => setFormData({ ...formData, depth: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">For 3D works/sculptures</p>
              </div>
            </div>

            {/* SECTION 2: COMMERCIAL STATUS */}
            <div className="space-y-4 pt-2 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground">Commercial Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as ArtworkStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Sold">Sold</SelectItem>
                    <SelectItem value="On Loan">On Loan</SelectItem>
                    <SelectItem value="Reserved">Reserved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-price">Price</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-price"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  value={formData.price}
                  onKeyDown={(e) => {
                    // Block decimal point and comma
                    if (e.key === '.' || e.key === ',') {
                      e.preventDefault();
                      toast({
                        title: "Whole numbers only",
                        description: "Please enter an integer value without decimals",
                        variant: "destructive",
                      });
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty or whole numbers only
                    if (value === '' || /^\d+$/.test(value)) {
                      setFormData({ ...formData, price: value });
                    }
                  }}
                  onBlur={(e) => {
                    // Round any pasted decimal values
                    const value = e.target.value;
                    if (value && value.includes('.')) {
                      const rounded = Math.round(parseFloat(value)).toString();
                      setFormData({ ...formData, price: rounded });
                      toast({
                        title: "Value rounded",
                        description: "Decimal values are not allowed. The price has been rounded to the nearest whole number.",
                      });
                    }
                  }}
                  className="flex-1"
                  style={{
                    appearance: 'textfield',
                    MozAppearance: 'textfield',
                    WebkitAppearance: 'none'
                  }}
                />
                <Select
                  value={formData.base_currency}
                  onValueChange={(value) => setFormData({ ...formData, base_currency: value })}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
                {formData.price && parseFloat(formData.price) > 0 && !isRateFailed && currencyCode !== formData.base_currency && (
                  <p className="text-xs text-muted-foreground">
                    ≈ {convertPrice(parseFloat(formData.price), formData.base_currency)}
                  </p>
                )}
              </div>
            </div>

            {/* SECTION 3: LOGISTICS & HISTORY */}
            <div className="space-y-4 pt-2 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground">Location & Provenance</h3>
              
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  list="edit-location-suggestions"
                  placeholder="e.g., Studio, Gallery X"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
                <datalist id="edit-location-suggestions">
                  {distinctLocations.map((location) => (
                    <option key={location} value={location} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-provenance">Provenance Log</Label>
                <Textarea
                  id="edit-provenance"
                  placeholder="History of ownership..."
                  value={formData.provenance_log}
                  onChange={(e) => setFormData({ ...formData, provenance_log: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* SECTION 4: ADDITIONAL VIEWS */}
            <div className="space-y-2 pt-4 border-t">
              <Label className="text-base font-semibold">Gallery / Close-ups</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Add multiple images to showcase different angles and details
              </p>
              <GalleryManager 
                artworkId={artwork.id} 
                onContentChange={() => setGalleryHasChanges(true)}
              />
            </div>

            <DrawerFooter className="px-0 pb-4">
              <Button type="submit" disabled={loading || !hasChanges}>
                {loading ? "Updating..." : "Update Artwork"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Artwork
              </Button>
              <Button 
                type="button"
                variant="outline" 
                onClick={handleAttemptClose}
              >
                Cancel
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Artwork</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this artwork? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showUnsavedAlert} onOpenChange={setShowUnsavedAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to this artwork. Are you sure you want to leave?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <Button
              variant="default"
              onClick={handleSaveAndClose}
              disabled={loading}
            >
              Save Changes
            </Button>
            <AlertDialogAction
              onClick={handleDiscardAndClose}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Cropper Dialog */}
      {tempImageUrl && (
        <ImageCropperDialog
          open={cropperOpen}
          onOpenChange={setCropperOpen}
          imageUrl={tempImageUrl}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
};
