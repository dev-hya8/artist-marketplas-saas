import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Upload, X, ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryManagerProps {
  artworkId: string | null;
}

interface GalleryImage {
  id: string;
  image_url: string;
  created_at: string;
}

export const GalleryManager = ({ artworkId }: GalleryManagerProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  useEffect(() => {
    if (artworkId) {
      fetchGalleryImages();
    }
  }, [artworkId]);

  // Keyboard navigation for lightbox
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

  const fetchGalleryImages = async () => {
    if (!artworkId) return;

    setLoading(true);
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

      fetchGalleryImages();
      e.target.value = "";
    } catch (error: any) {
      console.error("Gallery image upload error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload gallery image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('artwork_images')
        .remove([fileName]);

      if (storageError) console.warn("Storage deletion warning:", storageError);

      // Delete from database
      const { error: dbError } = await supabase
        .from("artwork_gallery")
        .delete()
        .eq("id", imageId);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Image removed",
      });

      // Close lightbox if open
      setLightboxImage(null);
      
      fetchGalleryImages();
    } catch (error: any) {
      console.error("Error deleting gallery image:", error);
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

  const maxImages = 4;
  const isAtMaxCapacity = galleryImages.length >= maxImages;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="gallery-upload">Additional Views</Label>
        <div className="flex gap-2">
          <Input
            id="gallery-upload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading || isAtMaxCapacity}
            className="flex-1"
          />
          <Button 
            type="button" 
            disabled={uploading || isAtMaxCapacity} 
            size="icon" 
            variant="outline"
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>
        {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
        {isAtMaxCapacity && (
          <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
            Maximum 4 additional photos reached (5 total)
          </p>
        )}
        {!isAtMaxCapacity && galleryImages.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {galleryImages.length} of {maxImages} additional images uploaded
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading gallery...</p>
      ) : galleryImages.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {galleryImages.map((image, index) => (
            <div key={image.id} className="relative group">
              <div 
                className="w-full rounded-md border overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => openLightbox(image.image_url, index)}
              >
                <img
                  src={image.image_url}
                  alt="Gallery"
                  className="w-full h-auto max-h-[300px] object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No additional images yet</p>
      )}

      {/* Lightbox Modal with Navigation */}
      <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden" aria-describedby={undefined}>
          {lightboxImage && (
            <div className="relative w-full bg-black">
              <img
                src={lightboxImage}
                alt="Full size preview"
                className="w-full h-auto max-h-[90vh] object-contain"
              />
              
              {/* Close Button - Top Right */}
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center transition-colors z-20"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              
              {/* Delete Button - Top Left */}
              <button
                onClick={() => {
                  const currentImage = galleryImages[lightboxIndex];
                  if (currentImage) {
                    handleDeleteImage(currentImage.id, currentImage.image_url);
                  }
                }}
                className="absolute top-4 left-4 h-10 w-10 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors z-20"
                aria-label="Delete image"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              
              {/* Previous Button */}
              {lightboxIndex > 0 && (
                <button
                  onClick={handlePreviousImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center transition-colors z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}
              
              {/* Next Button */}
              {lightboxIndex < galleryImages.length - 1 && (
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center transition-colors z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
              
              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                {lightboxIndex + 1} / {galleryImages.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
