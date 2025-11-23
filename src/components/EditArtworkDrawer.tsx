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
import { Trash2, Upload } from "lucide-react";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { useCurrency, CURRENCIES } from "@/contexts/CurrencyContext";
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
  
  const [formData, setFormData] = useState({
    title: artwork.title,
    image_url: artwork.image_url || "",
    price: artwork.price?.toString() || "",
    base_currency: artwork.base_currency || "USD",
    status: artwork.status,
    dimensions: artwork.dimensions || "",
    depth: artwork.depth?.toString() || "",
    medium: artwork.medium || "",
    location: artwork.location || "",
    provenance_log: artwork.provenance_log || "",
  });

  useEffect(() => {
    setFormData({
      title: artwork.title,
      image_url: artwork.image_url || "",
      price: artwork.price?.toString() || "",
      base_currency: artwork.base_currency || "USD",
      status: artwork.status,
      dimensions: artwork.dimensions || "",
      depth: artwork.depth?.toString() || "",
      medium: artwork.medium || "",
      location: artwork.location || "",
      provenance_log: artwork.provenance_log || "",
    });
  }, [artwork.id]);

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

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('artwork_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('artwork_images')
        .getPublicUrl(filePath);

      if (artwork.image_url) {
        try {
          const urlParts = artwork.image_url.split('/');
          const oldFileName = urlParts[urlParts.length - 1];
          
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

      setFormData({ ...formData, image_url: publicUrl });
      
      toast({
        title: "Success",
        description: "Thumbnail updated successfully",
      });

      e.target.value = "";
    } catch (error: any) {
      console.error("Thumbnail upload error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload thumbnail",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
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
          price: formData.price ? parseFloat(formData.price) : null,
          base_currency: formData.base_currency,
          status: formData.status,
          dimensions: formData.dimensions || null,
          depth: formData.depth ? parseFloat(formData.depth) : null,
          medium: formData.medium || null,
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

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Artwork</DrawerTitle>
            <DrawerDescription>Update the details of your artwork</DrawerDescription>
          </DrawerHeader>
          <form onSubmit={handleUpdate} className="px-4 space-y-4 max-h-[60vh] overflow-y-auto">
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
              <Label className="text-base font-semibold">Main Thumbnail</Label>
              
              {formData.image_url && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-muted">
                  <img 
                    src={formData.image_url} 
                    alt={formData.title}
                    className="w-full h-full object-contain"
                  />
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

            <div className="space-y-2">
              <Label htmlFor="edit-price">Price *</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-price"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setFormData({ ...formData, price: value });
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
              <Label htmlFor="edit-dimensions">Dimensions (H x W)</Label>
              <Input
                id="edit-dimensions"
                placeholder="e.g., 24 x 36"
                value={formData.dimensions}
                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
              />
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

            <div className="space-y-2">
              <Label htmlFor="edit-medium">Medium</Label>
              <Input
                id="edit-medium"
                placeholder="e.g., Oil on canvas"
                value={formData.medium}
                onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                placeholder="e.g., Studio, Gallery X"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
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

            <div className="space-y-2 pt-4 border-t">
              <Label className="text-base font-semibold">Gallery / Close-ups</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Add multiple images to showcase different angles and details
              </p>
              <GalleryManager artworkId={artwork.id} />
            </div>

            <DrawerFooter className="px-0 pb-4">
              <Button type="submit" disabled={loading}>
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
              <DrawerClose asChild>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
              </DrawerClose>
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
    </>
  );
};