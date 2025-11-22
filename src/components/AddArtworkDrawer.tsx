import { useState } from "react";
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
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    price: "",
    status: "Available" as ArtworkStatus,
    dimensions: "",
    medium: "",
    location: "",
  });
  const [errors, setErrors] = useState({
    image_url: false,
    price: false,
    dimensions: false,
    medium: false,
    location: false,
  });

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

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      price: !formData.price,
      dimensions: !formData.dimensions,
      medium: !formData.medium,
      location: !formData.location,
    };

    setErrors(newErrors);

    // Check if any errors exist
    if (Object.values(newErrors).some(error => error)) {
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
        price: formData.price ? parseFloat(formData.price) : null,
        status: formData.status,
        dimensions: formData.dimensions || null,
        medium: formData.medium || null,
        location: formData.location || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Artwork added successfully",
      });
      
      setFormData({
        title: "",
        image_url: "",
        price: "",
        status: "Available",
        dimensions: "",
        medium: "",
        location: "",
      });
      setImagePreview(null);
      setErrors({
        image_url: false,
        price: false,
        dimensions: false,
        medium: false,
        location: false,
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
        <form onSubmit={handleSubmit} className="px-4 space-y-4 max-h-[60vh] overflow-y-auto">
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
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-md border"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => {
                setFormData({ ...formData, price: e.target.value });
                setErrors({ ...errors, price: false });
              }}
              className={errors.price ? "border-destructive" : ""}
            />
            {errors.price && (
              <p className="text-sm text-destructive">Price is required</p>
            )}
          </div>

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
            <Label htmlFor="dimensions">Dimensions *</Label>
            <Input
              id="dimensions"
              placeholder="e.g., 24x36 inches"
              value={formData.dimensions}
              onChange={(e) => {
                setFormData({ ...formData, dimensions: e.target.value });
                setErrors({ ...errors, dimensions: false });
              }}
              className={errors.dimensions ? "border-destructive" : ""}
            />
            {errors.dimensions && (
              <p className="text-sm text-destructive">Dimensions are required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="medium">Medium *</Label>
            <Input
              id="medium"
              placeholder="e.g., Oil on canvas"
              value={formData.medium}
              onChange={(e) => {
                setFormData({ ...formData, medium: e.target.value });
                setErrors({ ...errors, medium: false });
              }}
              className={errors.medium ? "border-destructive" : ""}
            />
            {errors.medium && (
              <p className="text-sm text-destructive">Medium is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              placeholder="e.g., Studio, Gallery X"
              value={formData.location}
              onChange={(e) => {
                setFormData({ ...formData, location: e.target.value });
                setErrors({ ...errors, location: false });
              }}
              className={errors.location ? "border-destructive" : ""}
            />
            {errors.location && (
              <p className="text-sm text-destructive">Location is required</p>
            )}
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
    </Drawer>
  );
};
