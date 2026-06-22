import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { checkForUnits } from "@/utils/artworkValidation";
import type { Database, Tables } from "@/integrations/supabase/types";

type Artwork = Tables<"artworks">;
type ArtworkStatus = Database["public"]["Enums"]["artwork_status"];

interface UseArtworkFormProps {
  artwork?: Artwork;
  onSuccess: () => void;
  onClose: () => void;
}

const emptyFormData = {
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
};

export const useArtworkForm = ({ artwork, onSuccess, onClose }: UseArtworkFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [distinctMedia, setDistinctMedia] = useState<string[]>([]);
  const [distinctLocations, setDistinctLocations] = useState<string[]>([]);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  
  const [formData, setFormData] = useState(emptyFormData);
  const [errors, setErrors] = useState({
    image_url: false,
    dimensions: false,
    medium: false,
  });
  const [dimensionUnitWarning, setDimensionUnitWarning] = useState(false);

  // Initialize form state
  useEffect(() => {
    if (artwork) {
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
      setImagePreview(artwork.image_url || null);
    } else {
      setFormData(emptyFormData);
      setImagePreview(null);
    }
    setErrors({ image_url: false, dimensions: false, medium: false });
    setDimensionUnitWarning(false);
  }, [artwork?.id]);

  const fetchDefaultUnit = async () => {
    try {
      const { data, error } = await supabase
        .from("artist_settings")
        .select("measurement_unit")
        .maybeSingle();

      if (error) throw error;
      if (data?.measurement_unit) {
        setFormData(prev => ({ ...prev, dimension_unit: data.measurement_unit }));
      }
    } catch (err) {
      console.error("Error fetching default unit:", err);
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
    } catch (err) {
      console.error("Error fetching autocomplete data:", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImageUrl(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCroppedBlob(croppedBlob);
    setImagePreview(URL.createObjectURL(croppedBlob));
    setUploading(true);

    try {
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.jpg`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("artwork_images")
        .upload(filePath, croppedBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("artwork_images")
        .getPublicUrl(filePath);

      // Delete old image if replacing
      if (artwork?.image_url) {
        try {
          const urlParts = artwork.image_url.split("/");
          const oldFileName = urlParts[urlParts.length - 1].split("?")[0];
          await supabase.storage.from("artwork_images").remove([oldFileName]);
        } catch (delErr) {
          console.warn("Could not delete old image:", delErr);
        }
      }

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast({
        title: "Success",
        description: artwork ? "Thumbnail updated successfully" : "Image uploaded successfully",
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to upload image",
        variant: "destructive",
      });
      setImagePreview(artwork?.image_url || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRecrop = () => {
    const targetUrl = imagePreview || formData.image_url;
    if (targetUrl) {
      setTempImageUrl(targetUrl);
      setCropperOpen(true);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image_url: "" }));
  };

  const validateForm = () => {
    const newErrors = {
      image_url: !formData.image_url,
      dimensions: !formData.dimensions,
      medium: !formData.medium,
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      const errorMessages = [];
      if (newErrors.image_url) errorMessages.push("Image is required");
      if (newErrors.dimensions) errorMessages.push("Dimensions are required");
      if (newErrors.medium) errorMessages.push("Medium is required");
      
      window.alert("Validation Failed:\n\n" + errorMessages.join("\n"));
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields before submitting",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm() || uploading) return;
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
        window.alert("Database Error:\n\n" + JSON.stringify(error, null, 2));
        throw error;
      }

      toast({ title: "Success", description: "Artwork added successfully" });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Create error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to add artwork",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!artwork || !validateForm() || uploading) return;
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

      toast({ title: "Success", description: "Artwork updated successfully" });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Update error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update artwork",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!artwork) return;
    setLoading(true);

    try {
      if (artwork.image_url) {
        try {
          const urlParts = artwork.image_url.split("/");
          const fileName = urlParts[urlParts.length - 1];
          await supabase.storage.from("artwork_images").remove([fileName]);
        } catch (storageError) {
          console.error("Storage deletion error:", storageError);
        }
      }

      const { error } = await supabase
        .from("artworks")
        .delete()
        .eq("id", artwork.id);

      if (error) throw error;

      toast({ title: "Success", description: "Artwork deleted successfully" });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Delete error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete artwork",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = artwork
    ? formData.title !== artwork.title ||
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
      formData.provenance_log !== (artwork.provenance_log || "")
    : false;

  const handleDimensionsChange = (val: string) => {
    setFormData(prev => ({ ...prev, dimensions: val }));
    setErrors(prev => ({ ...prev, dimensions: false }));
    setDimensionUnitWarning(checkForUnits(val));
  };

  return {
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
    handleUpdate,
    handleDelete,
    hasChanges,
    handleDimensionsChange,
  };
};
