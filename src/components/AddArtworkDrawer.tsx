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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCurrency, CURRENCIES } from "@/contexts/CurrencyContext";
import { Trash2, Crop } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ImageCropperDialog } from "@/components/ImageCropperDialog";
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
  const { toast } = useToast();
  const { convertPrice, currencyCode, isRateFailed } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [distinctMedia, setDistinctMedia] = useState<string[]>([]);
  const [distinctLocations, setDistinctLocations] = useState<string[]>([]);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    creation_year: "",
    medium: "",
    dimensions: "",
    dimension_unit: "in",
    depth: "",
    status: "Available" as ArtworkStatus,
    price: "",
    base_currency: "USD",
    location: "",
    provenance_log: "",
  });

  // Fetch default unit and autocomplete data
  useEffect(() => {
    fetchDefaultUnit();
    fetchAutocompleteData();
  }, [open]);

  const fetchDefaultUnit = async () => {
    try {
      const { data, error } = await supabase
        .from("artist_settings")
        .select("measurement_unit")
        .maybeSingle();

      if (error) throw error;
      
      if (data && data.measurement_unit) {
        setFormData(prev => ({ ...prev, dimension_unit: data.measurement_unit }));
      }
    } catch (error) {
      console.error("Error fetching default unit:", error);
    }
  };

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
  const [errors, setErrors] = useState({
    image_url: false,
    dimensions: false,
    medium: false,
  });
  const [dimensionUnitWarning, setDimensionUnitWarning] = useState(false);

  // Function to check if dimensions contain unit keywords
  const checkForUnits = (text: string): boolean => {
    const unitKeywords = /\b(in|inch|inches|cm|ft|feet)\b/i;
    return unitKeywords.test(text);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      e.target.value = ""; // Reset file input
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
    setCroppedBlob(croppedBlob);
    
    // Create preview URL for the cropped image
    const previewUrl = URL.createObjectURL(croppedBlob);
    setImagePreview(previewUrl);

    // Upload the cropped image
    setUploading(true);
    try {
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.jpg`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('artwork_images')
        .upload(filePath, croppedBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('artwork_images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRecrop = () => {
    if (imagePreview) {
      setTempImageUrl(imagePreview);
      setCropperOpen(true);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData({ ...formData, image_url: "" });
    // Note: We don't need to clear the file input value imperatively here 
    // as the preview state controls the UI
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form values on submit:', formData);
    
    if (uploading) {
      toast({
        title: "Please wait",
        description: "Image is still uploading",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    const newErrors = {
      image_url: !formData.image_url,
      dimensions: !formData.dimensions,
      medium: !formData.medium,
    };

    setErrors(newErrors);

    // Check if any errors exist
    if (Object.values(newErrors).some(error => error)) {
      const errorMessages = [];
      if (newErrors.image_url) errorMessages.push("Image is required");
      if (newErrors.dimensions) errorMessages.push("Dimensions are required");
      if (newErrors.medium) errorMessages.push("Medium is required");
      
      const errorMessage = errorMessages.join("\n");
      window.alert("Validation Failed:\n\n" + errorMessage);
      
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields before submitting",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("artworks").insert({
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
      });

      if (error) {
        console.error('Supabase insert error:', error);
        window.alert("Database Error:\n\n" + JSON.stringify(error, null, 2));
        throw error;
      }

      toast({
        title: "Success",
        description: "Artwork added successfully",
      });
      
      setFormData({
        title: "",
        image_url: "",
        creation_year: "",
        medium: "",
        dimensions: "",
        dimension_unit: "in",
        depth: "",
        status: "Available",
        price: "",
        base_currency: "USD",
        location: "",
        provenance_log: "",
      });
      setImagePreview(null);
      setErrors({
        image_url: false,
        dimensions: false,
        medium: false,
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Artwork submission error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add artwork",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
                onChange={(e) => {
                  setFormData({ ...formData, medium: e.target.value });
                  setErrors({ ...errors, medium: false });
                }}
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
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, dimensions: value });
                    setErrors({ ...errors, dimensions: false });
                    setDimensionUnitWarning(checkForUnits(value));
                  }}
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
                  onKeyDown={(e) => {
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
                    if (value === '' || /^\d+$/.test(value)) {
                      setFormData({ ...formData, price: value });
                    }
                  }}
                  onBlur={(e) => {
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
