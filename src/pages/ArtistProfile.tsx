import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArtistProfileHeader } from "@/components/artist-profile/ArtistProfileHeader";
import { ArtworkGrid } from "@/components/artist-profile/ArtworkGrid";
import { ArtistProfileFooter } from "@/components/artist-profile/ArtistProfileFooter";
import { ProfileInquiryModal } from "@/components/artist-profile/ProfileInquiryModal";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface ArtistSettings {
  id: string;
  user_id: string | null;
  display_name: string;
  artist_bio?: string | null;
  avatar_url?: string | null;
  contact_email?: string | null;
}

interface Artwork {
  id: string;
  title: string;
  medium: string | null;
  dimensions: string | null;
  price: number | null;
  image_url: string | null;
}

interface ArtistProfileProps {
  artistSettings?: ArtistSettings;
  artworks?: Artwork[];
}

export default function ArtistProfile({ artistSettings, artworks = [] }: ArtistProfileProps) {
  const navigate = useNavigate();
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [activeSection, setActiveSection] = useState<"works" | "about" | "contact">("works");
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const checkOwnership = async () => {
      if (!artistSettings?.user_id) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id === artistSettings.user_id) {
        setIsOwner(true);
      }
    };
    
    checkOwnership();
  }, [artistSettings?.user_id]);

  // Type for display artworks matching ArtworkGrid expectations
  type DisplayArtwork = {
    id: string;
    title: string;
    medium: string;
    dimensions: string;
    price: number;
    imageUrl: string;
  };

  const handleInquire = (artwork: DisplayArtwork) => {
    // Find the original artwork to set as selected
    const originalArtwork = artworks.find(a => a.id === artwork.id);
    if (originalArtwork) {
      setSelectedArtwork(originalArtwork);
    }
    setInquiryModalOpen(true);
  };

  const handleContactClick = () => {
    setSelectedArtwork(null);
    setInquiryModalOpen(true);
  };

  const artistName = artistSettings?.display_name || "Artist";
  const artistBio = artistSettings?.artist_bio;

  // Transform artworks for the grid
  const displayArtworks = artworks.map(art => ({
    id: art.id,
    title: art.title,
    medium: art.medium || "",
    dimensions: art.dimensions || "",
    price: art.price || 0,
    imageUrl: art.image_url || "",
  }));

  const isEmpty = displayArtworks.length === 0;

  return (
    <div className="min-h-screen bg-white">
      <ArtistProfileHeader 
        artistName={artistName}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onContactClick={handleContactClick}
      />

      <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-32 pb-24">
        {activeSection === "works" && (
          isEmpty ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
              <div className="space-y-3 max-w-md">
                <h2 className="font-serif text-2xl text-neutral-900">
                  {artistName} is currently curating their collection.
                </h2>
                <p className="text-neutral-500">
                  Please check back soon for available works.
                </p>
              </div>
              
              {/* Show upload button only if owner is viewing their own empty profile */}
              {isOwner && (
                <Button
                  onClick={() => navigate("/admin")}
                  className="mt-6"
                  size="lg"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload your first piece
                </Button>
              )}
            </div>
          ) : (
            <ArtworkGrid 
              artworks={displayArtworks} 
              onInquire={handleInquire}
            />
          )
        )}

        {activeSection === "about" && (
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <h2 className="font-serif text-3xl text-neutral-900">About the Artist</h2>
            {artistBio ? (
              <p className="text-neutral-600 leading-relaxed text-lg whitespace-pre-line">
                {artistBio}
              </p>
            ) : (
              <>
                <p className="text-neutral-600 leading-relaxed text-lg">
                  {artistName} is a contemporary artist whose work explores the intersection of 
                  fragmentation and unity. Each piece is meticulously crafted and assembled, 
                  transforming materials into cohesive visual narratives.
                </p>
                <p className="text-neutral-600 leading-relaxed">
                  Based in the Pacific Northwest, {artistName} draws inspiration from natural patterns, 
                  urban textures, and the Japanese philosophy of wabi-sabi—finding beauty in 
                  imperfection.
                </p>
              </>
            )}
          </div>
        )}

        {activeSection === "contact" && (
          <div className="max-w-md mx-auto text-center space-y-8">
            <h2 className="font-serif text-3xl text-neutral-900">Get in Touch</h2>
            <p className="text-neutral-600 leading-relaxed">
              Interested in commissioning a piece or learning more about available works? 
              I'd love to hear from you.
            </p>
            <button
              onClick={handleContactClick}
              className="px-8 py-3 bg-neutral-900 text-white text-sm tracking-wide uppercase hover:bg-neutral-800 transition-colors"
            >
              Send an Inquiry
            </button>
          </div>
        )}
      </main>

      <ArtistProfileFooter />

      <ProfileInquiryModal
        open={inquiryModalOpen}
        onOpenChange={setInquiryModalOpen}
        artwork={selectedArtwork ? {
          id: selectedArtwork.id,
          title: selectedArtwork.title,
          medium: selectedArtwork.medium || "",
          dimensions: selectedArtwork.dimensions || "",
          price: selectedArtwork.price || 0,
          imageUrl: selectedArtwork.image_url || "",
        } : null}
      />
    </div>
  );
}
