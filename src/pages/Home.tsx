import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

type Artwork = Database["public"]["Tables"]["artworks"]["Row"];

export default function Home() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      const { data, error } = await supabase
        .from("artworks")
        .select("*")
        .order("status", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Sort: Available first, then others
      const sorted = data?.sort((a, b) => {
        if (a.status === "Available" && b.status !== "Available") return -1;
        if (a.status !== "Available" && b.status === "Available") return 1;
        return 0;
      });

      setArtworks(sorted || []);
    } catch (error) {
      console.error("Error fetching artworks:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Masonry Grid Layout */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
          {artworks.map((artwork) => (
            <div
              key={artwork.id}
              className="break-inside-avoid group"
            >
              {/* Image Container */}
              <div className="relative mb-4 overflow-hidden bg-muted">
                {artwork.image_url ? (
                  <img
                    src={artwork.image_url}
                    alt={artwork.title}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="aspect-square flex items-center justify-center bg-muted">
                    <span className="text-muted-foreground text-sm">No image</span>
                  </div>
                )}
                
                {/* Sold Badge Overlay */}
                {artwork.status === "Sold" && (
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                      <span className="text-xs font-medium text-destructive">SOLD</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Artwork Details */}
              <div className="space-y-2">
                <h3 className="text-lg font-light tracking-wide">{artwork.title}</h3>
                
                {artwork.dimensions && (
                  <p className="text-sm text-muted-foreground font-light">
                    {artwork.dimensions}
                  </p>
                )}

                {/* Price and Inquire Button (only for Available) */}
                {artwork.status === "Available" && (
                  <div className="flex items-center justify-between pt-2">
                    {artwork.price && (
                      <p className="text-base font-light">
                        ${artwork.price.toLocaleString()}
                      </p>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="ml-auto"
                    >
                      Inquire
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {artworks.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            No artworks available yet.
          </div>
        )}
      </main>
    </div>
  );
}
