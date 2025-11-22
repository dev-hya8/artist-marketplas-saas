import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ArtworkCarouselProps {
  artworkId: string;
  mainImageUrl: string | null;
  artworkTitle: string;
}

interface GalleryImage {
  id: string;
  image_url: string;
}

export const ArtworkCarousel = ({ artworkId, mainImageUrl, artworkTitle }: ArtworkCarouselProps) => {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGalleryImages();
  }, [artworkId]);

  const fetchGalleryImages = async () => {
    try {
      const { data, error } = await supabase
        .from("artwork_gallery")
        .select("*")
        .eq("artwork_id", artworkId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setGalleryImages(data || []);
    } catch (error) {
      console.error("Error fetching gallery images:", error);
    } finally {
      setLoading(false);
    }
  };

  // Combine main image with gallery images
  const allImages = [
    ...(mainImageUrl ? [{ id: "main", image_url: mainImageUrl }] : []),
    ...galleryImages,
  ];

  // If only one image (main image), show it without carousel
  if (allImages.length <= 1) {
    return (
      <div className="relative overflow-hidden bg-muted">
        {mainImageUrl ? (
          <img
            src={mainImageUrl}
            alt={artworkTitle}
            className="w-full h-auto object-cover"
          />
        ) : (
          <div className="aspect-square flex items-center justify-center bg-muted">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}
      </div>
    );
  }

  // Show carousel if multiple images
  return (
    <div className="relative overflow-hidden bg-muted group">
      <Carousel className="w-full">
        <CarouselContent>
          {allImages.map((image, index) => (
            <CarouselItem key={image.id}>
              <img
                src={image.image_url}
                alt={`${artworkTitle} - View ${index + 1}`}
                className="w-full h-auto object-cover"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        <CarouselNext className="right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Carousel>
      {/* Image counter */}
      <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs">
        {allImages.length} photos
      </div>
    </div>
  );
};
