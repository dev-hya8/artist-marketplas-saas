import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, X, ChevronLeft, ChevronRight, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GalleryManagerProps {
  artworkId: string | null;
}

interface GalleryImage {
  id: string;
  image_url: string;
  created_at: string;
}

// Define a type for local previews
interface PendingUpload {
  id: string; // Temporary ID
  previewUrl: string;
  file: File;
}

export const GalleryManager = ({ artworkId }: GalleryManagerProps) => {
  const { toast } = useToast();
  // We'll use a local state to track uploads in progress
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  // Track images that failed to load to show a placeholder
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const fetchGalleryImages = useCallback(async () => {
    if (!artworkId) return;

    // Only show global loading on initial fetch
    if (galleryImages.length === 0) setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("artwork_gallery")
        .select("*")
        .eq("artwork_id", artworkId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGalleryImages(data || []);
    } catch (error: any) {
      console.error("Error fetching gallery images:", error);
    } finally {
      setLoading(false);
    }
  }, [artworkId]);

  useEffect(() => {
    fetchGalleryImages();
  }, [fetchGalleryImages]);

  // Handle Keyboard Navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxImage) return;
      
      if (e.key === "ArrowLeft") {
        handlePreviousImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      } else if (e.key === "Escape") {
        setLightboxImage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxImage, lightboxIndex, galleryImages]);

  const handlePreviousImage = () => {
    if (lightboxIndex > 0) {
      const newIndex = lightboxIndex - 1;
      setLightboxIndex(newIndex);
      setLightboxImage(galleryImages[newIndex].image_url);
    }
  };

  const handleNextImage = () => {
    if (lightboxIndex < galleryImages.length - 1) {
      const newIndex = lightboxIndex + 1;
      setLightboxIndex(newIndex);
      setLightboxImage(galleryImages[newIndex].image_url);
    }
  };

  const openLightbox = (imageUrl: string, index: number) => {
    setLightboxImage(imageUrl);
    setLightboxIndex(index);
  };

  const uploadFile = async (file: File) => {
    if (!artworkId) return;

    // 1. Create a temporary local preview
    const tempId = Math.random().toString(36).substring(7);
    const previewUrl = URL.createObjectURL(file);
    const newPendingUpload: PendingUpload = { id: tempId, previewUrl, file };

    // 2. Add to pending queue to show immediately in UI
    setPendingUploads(prev => [newPendingUpload, ...prev]);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // 3. Start uploading to Supabase
      const { error: uploadError } = await supabase.storage
        .from('artwork_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('artwork_images')
        .getPublicUrl(filePath);

      // 4. Insert into database
      const { error: dbError } = await supabase
        .from("artwork_gallery")
        .insert({
          artwork_id: artworkId,
          image_url: publicUrl,
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Gallery image uploaded successfully",
      });

      // 5. On success, refetch real data and remove from pending
      await fetchGalleryImages();
      
    } catch (error: any) {
      console.error("Gallery image upload error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload gallery image",
        variant: "destructive",
      });
    } finally {
      // Remove from pending list regardless of success/failure
      setPendingUploads(prev => prev.filter(p => p.id !== tempId));
      URL.revokeObjectURL(previewUrl); // Clean up memory
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!artworkId) {
      toast({
        title: "Error",
        description: "Please save the artwork first before adding gallery images",
        variant: "destructive",
      });
      return;
    }

    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
    } else {
      // Start the upload process
      uploadFile(file);
    }
    
    // Reset input
    e.target.value = "";
  };

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    const confirmed = window.confirm("Are you sure you want to remove this image?");
    if (!confirmed) return;

    // Optimistic update
    const previousImages = [...galleryImages];
    setGalleryImages(current => current.filter(img => img.id !== imageId));

    try {
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      const { error: storageError } = await supabase.storage
        .from('artwork_images')
        .remove([fileName]);

      if (storageError) {
        console.warn("Storage deletion error (image might already be gone):", storageError);
      }

      const { error: dbError } = await supabase
        .from("artwork_gallery")
        .delete()
        .eq("id", imageId);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Image removed successfully",
      });
      
    } catch (error: any) {
      console.error("Error deleting gallery image:", error);
      setGalleryImages(previousImages); // Revert on error
      toast({
        title: "Error",
        description: error.message || "Failed to delete gallery image",
        variant: "destructive",
      });
    }
  };

  if (!artworkId) {
    return (
      <div className="space-y-2">
        <Label>Additional Views</Label>
        <p className="text-sm text-muted-foreground">
          Save the artwork first to add gallery images
        </p>
      </div>
    );
  }

  const totalImages = galleryImages.length + pendingUploads.length;
  const maxImages = 4;
  const isAtMaxCapacity = totalImages >= maxImages;
  const isUploading = pendingUploads.length > 0;

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="gallery-upload">Additional Views</Label>
          {!isAtMaxCapacity && totalImages > 0 && (
            <span className="text-xs text-muted-foreground">
              {totalImages} of {maxImages}
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
           <Input
            id="gallery-upload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading || isAtMaxCapacity}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('gallery-upload')?.click()}
            disabled={isUploading || isAtMaxCapacity}
            className="w-full border-dashed"
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isUploading ? "Uploading..." : isAtMaxCapacity ? "Max Limit Reached" : "Add Gallery Image"}
          </Button>
        </div>

        {isAtMaxCapacity && (
          <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
            Maximum 4 additional photos reached
          </p>
        )}
      </div>

      {/* Grid Display */}
      {loading && galleryImages.length === 0 && pendingUploads.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading gallery...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          
          {/* 1. Render Pending Uploads First */}
          {pendingUploads.map((pending) => (
            <div key={pending.id} className="relative group aspect-square">
              <div className="w-full h-full rounded-md border overflow-hidden bg-muted relative">
                <img
                  src={pending.previewUrl}
                  alt="Uploading preview"
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              </div>
            </div>
          ))}

          {/* 2. Render Existing Gallery Images */}
          {galleryImages.map((image, index) => {
            const hasFailed = failedImages.has(image.id);
            return (
            <div key={image.id} className="relative group aspect-square">
              <div 
                className="w-full h-full rounded-md border overflow-hidden cursor-pointer hover:opacity-90 transition-opacity bg-muted flex items-center justify-center"
                onClick={() => !hasFailed && openLightbox(image.image_url, index)}
              >
                {hasFailed ? (
                  <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                ) : (
                  <img
                    src={image.image_url}
                    alt="Gallery"
                    className="w-full h-full object-cover"
                    onError={() => setFailedImages(prev => new Set(prev).add(image.id))}
                  />
                )}
              </div>
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteImage(image.id, image.image_url);
                }}
                className="absolute top-1 right-1 p-1.5 rounded-full bg-white shadow-sm hover:bg-red-50 text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all z-10"
                title="Remove image"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )})}
        </div>
      )}

      {/* Lightbox Modal */}
      <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black/95 border-none" aria-describedby={undefined}>
          {lightboxImage && (
            <div className="relative w-full h-[80vh] flex items-center justify-center">
              <img
                src={lightboxImage}
                alt="Full size preview"
                className="max-w-full max-h-full object-contain"
              />
              
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-50"
              >
                <X className="h-6 w-6" />
              </button>
              
              {lightboxIndex > 0 && (
                <button
                  onClick={handlePreviousImage}
                  className="absolute left-4 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-40"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
              )}
              
              {lightboxIndex < galleryImages.length - 1 && (
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-40"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              )}
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-1 rounded-full text-sm">
                {lightboxIndex + 1} / {galleryImages.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
