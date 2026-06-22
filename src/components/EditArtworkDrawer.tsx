import { useState, useEffect } from "react";
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
import { Trash2, Upload, Crop, X } from "lucide-react";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { ImageCropperDialog } from "@/components/ImageCropperDialog";
import { useCurrency, CURRENCIES } from "@/contexts/CurrencyContext";
import { useArtworkForm } from "@/hooks/useArtworkForm";
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
  const { convertPrice, currencyCode, isRateFailed } = useCurrency();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  const [galleryHasChanges, setGalleryHasChanges] = useState(false);

  const {
    formData,
    setFormData,
    loading,
    uploading,
    imagePreview,
    distinctMedia,
    distinctLocations,
    cropperOpen,
    setCropperOpen,
    tempImageUrl,
    setTempImageUrl,
    errors,
    dimensionUnitWarning,
    fetchAutocompleteData,
    handleFileUpload,
    handleCropComplete,
    handleRecrop,
    handleRemoveImage,
    handleUpdate,
    handleDelete,
    hasChanges: hookHasChanges,
    handleDimensionsChange,
  } = useArtworkForm({
    artwork,
    onSuccess,
    onClose,
  });

  // Fetch autocompletes when the drawer opens or the artwork changes
  useEffect(() => {
    if (open) {
      fetchAutocompleteData();
      setGalleryHasChanges(false);
    }
  }, [open, artwork.id]);

  const hasChanges = hookHasChanges || galleryHasChanges;

  const handleAttemptClose = () => {
    if (hasChanges) {
      setShowUnsavedAlert(true);
    } else {
      onClose();
    }
  };

  const handleSaveAndClose = async () => {
    await handleUpdate();
    setShowUnsavedAlert(false);
  };

  const handleDiscardAndClose = () => {
    setShowUnsavedAlert(false);
    onClose();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUpdate();
  };

  return (
    <>
      <Drawer open={open} onOpenChange={(isOpen) => !isOpen && handleAttemptClose()}>
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
          <form onSubmit={onSubmit} className="px-4 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* MAIN IMAGE UPLOAD */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Main Thumbnail</Label>
              
              {imagePreview && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-muted group">
                  <img 
                    src={imagePreview} 
                    alt={formData.title}
                    className="w-full h-full object-contain"
                  />
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
                      onClick={handleRemoveImage}
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
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("edit-thumbnail-upload")?.click()}
                  disabled={uploading}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Uploading..." : imagePreview ? "Change Thumbnail" : "Upload Thumbnail"}
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
                <Label htmlFor="edit-medium">Medium *</Label>
                <Input
                  id="edit-medium"
                  list="edit-medium-suggestions"
                  placeholder="e.g., Oil on canvas"
                  value={formData.medium}
                  onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                  className={errors.medium ? "border-destructive" : ""}
                />
                <datalist id="edit-medium-suggestions">
                  {distinctMedia.map((medium) => (
                    <option key={medium} value={medium} />
                  ))}
                </datalist>
                {errors.medium && (
                  <p className="text-sm text-destructive">Medium is required</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-dimensions">Dimensions (H x W) *</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-dimensions"
                    placeholder="e.g. 24 x 36 (Enter numbers only)"
                    value={formData.dimensions}
                    onChange={(e) => handleDimensionsChange(e.target.value)}
                    className={`flex-1 ${errors.dimensions ? "border-destructive" : ""}`}
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
                {errors.dimensions && (
                  <p className="text-sm text-destructive">Dimensions are required</p>
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
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d+$/.test(val)) {
                        setFormData({ ...formData, price: val });
                      }
                    }}
                    className="flex-1"
                    style={{
                      appearance: "textfield",
                      MozAppearance: "textfield",
                      WebkitAppearance: "none",
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
                onClick={() => setShowDeleteDialog(true)}
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
              onClick={handleDelete}
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
