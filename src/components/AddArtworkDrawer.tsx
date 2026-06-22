import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency, CURRENCIES } from "@/contexts/CurrencyContext";
import { Trash2, Crop } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ImageCropperDialog } from "@/components/ImageCropperDialog";
import { useArtworkForm } from "@/hooks/useArtworkForm";
import type { Database } from "@/integrations/supabase/types";

type ArtworkStatus = Database["public"]["Enums"]["artwork_status"];

interface AddArtworkDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddArtworkDrawer = ({
  open,
  onOpenChange,
  onSuccess,
}: AddArtworkDrawerProps) => {
  const { convertPrice, currencyCode, isRateFailed } = useCurrency();

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
    fetchDefaultUnit,
    fetchAutocompleteData,
    handleFileUpload,
    handleCropComplete,
    handleRecrop,
    handleRemoveImage,
    handleCreate,
    handleDimensionsChange,
  } = useArtworkForm({
    onSuccess,
    onClose: () => onOpenChange(false),
  });

  // Fetch autocompletes and settings when opened
  useEffect(() => {
    if (open) {
      fetchDefaultUnit();
      fetchAutocompleteData();
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreate();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add New Artwork</DrawerTitle>
          <DrawerDescription>Fill in the details for your new artwork</DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="px-4 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* MAIN IMAGE UPLOAD */}
          <div className="space-y-2">
            <Label htmlFor="image">Artwork Image *</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className={errors.image_url ? "border-destructive" : ""}
            />
            {uploading && <p className="text-sm text-muted-foreground">Uploading image...</p>}
            {errors.image_url && !uploading && (
              <p className="text-sm text-destructive">Image is required</p>
            )}
            {imagePreview && (
              <div className="mt-2 relative group">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-md border"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    type="button"
                    onClick={handleRecrop}
                    className="p-1.5 bg-white/80 rounded-full hover:bg-blue-100 transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Recrop image"
                  >
                    <Crop className="w-4 h-4 text-blue-500" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-1.5 bg-white/80 rounded-full hover:bg-red-100 transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Remove image"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 1: THE OBJECT (TOMBSTONE DATA) */}
          <div className="space-y-4 pt-2 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground">Artwork Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creation_year">Creation Year</Label>
              <Input
                id="creation_year"
                type="number"
                min="1000"
                max="2100"
                placeholder="e.g., 2024"
                value={formData.creation_year}
                onChange={(e) => setFormData({ ...formData, creation_year: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medium">Medium *</Label>
              <Input
                id="medium"
                list="medium-suggestions"
                placeholder="e.g., Oil on canvas"
                value={formData.medium}
                onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                className={errors.medium ? "border-destructive" : ""}
              />
              <datalist id="medium-suggestions">
                {distinctMedia.map((medium) => (
                  <option key={medium} value={medium} />
                ))}
              </datalist>
              {errors.medium && (
                <p className="text-sm text-destructive">Medium is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dimensions">Dimensions (H x W) *</Label>
              <div className="flex gap-2">
                <Input
                  id="dimensions"
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
              <Label htmlFor="depth">Depth (optional)</Label>
              <Input
                id="depth"
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
              <Label htmlFor="status">Status</Label>
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
              <Label htmlFor="price">Price</Label>
              <div className="flex gap-2">
                <Input
                  id="price"
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
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                list="location-suggestions"
                placeholder="e.g., Studio, Gallery X"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <datalist id="location-suggestions">
                {distinctLocations.map((location) => (
                  <option key={location} value={location} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provenance_log">Provenance Log</Label>
              <Textarea
                id="provenance_log"
                placeholder="History of ownership..."
                value={formData.provenance_log}
                onChange={(e) => setFormData({ ...formData, provenance_log: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DrawerFooter className="px-0 pb-4">
            <Button type="submit" disabled={loading || uploading}>
              {loading ? "Adding..." : uploading ? "Uploading..." : "Add Artwork"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" disabled={loading || uploading}>Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>

      {/* Image Cropper Dialog */}
      {tempImageUrl && (
        <ImageCropperDialog
          open={cropperOpen}
          onOpenChange={setCropperOpen}
          imageUrl={tempImageUrl}
          onCropComplete={handleCropComplete}
        />
      )}
    </Drawer>
  );
};
