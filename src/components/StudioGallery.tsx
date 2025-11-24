import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { getOptimizedImageUrl } from "@/lib/imageUtils";

interface StudioPhoto {
  id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
}

export const StudioGallery = () => {
  const [photos, setPhotos] = useState<StudioPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchStudioPhotos();
  }, []);

  const fetchStudioPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from("studio_photos")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error("Error fetching studio photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = (photoId: string) => {
    setLoadedImages(prev => new Set(prev).add(photoId));
  };

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-light tracking-wide text-center mb-12">
            In The Studio
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (photos.length === 0) {
    return null;
  }

  // Prepare slides for lightbox
  const slides = photos.map(photo => ({
    src: getOptimizedImageUrl(photo.image_url, 1200) || "",
    alt: photo.caption || "Studio photo",
  }));

  return (
    <>
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-light tracking-wide text-center mb-12">
            In The Studio
          </h2>

          {/* CSS Grid Masonry Layout */}
          <div 
            className="grid gap-4"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gridAutoRows: '250px',
              gridAutoFlow: 'dense'
            }}
          >
            {photos.map((photo, index) => {
              const optimizedUrl = getOptimizedImageUrl(photo.image_url, 600);
              const isLoaded = loadedImages.has(photo.id);
              
              // Randomly vary grid cell spans for masonry effect
              const spanClass = index % 5 === 0 
                ? 'row-span-2' 
                : index % 7 === 0 
                  ? 'col-span-2' 
                  : '';

              return (
                <div
                  key={photo.id}
                  className={`relative group cursor-pointer overflow-hidden rounded-lg bg-muted ${spanClass}`}
                  onClick={() => openLightbox(index)}
                >
                  {/* Skeleton Loader */}
                  {!isLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer" />
                  )}

                  {/* Image */}
                  {optimizedUrl && (
                    <img
                      src={optimizedUrl}
                      alt={photo.caption || "Studio photo"}
                      loading="lazy"
                      onLoad={() => handleImageLoad(photo.id)}
                      className={`w-full h-full object-cover transition-all duration-300 
                        ${isLoaded ? 'opacity-100' : 'opacity-0'}
                        group-hover:scale-105`}
                    />
                  )}

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />

                  {/* Caption overlay */}
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white text-sm">{photo.caption}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={currentIndex}
        slides={slides}
        styles={{
          container: { backgroundColor: "rgba(0, 0, 0, 0.95)" },
        }}
      />
    </>
  );
}
