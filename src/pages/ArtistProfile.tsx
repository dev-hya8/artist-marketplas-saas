import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArtistProfileHeader } from "@/components/artist-profile/ArtistProfileHeader";
import { ArtworkGrid } from "@/components/artist-profile/ArtworkGrid";
import { ArtistProfileFooter } from "@/components/artist-profile/ArtistProfileFooter";
import { ProfileInquiryModal } from "@/components/artist-profile/ProfileInquiryModal";

// Placeholder artwork data for the mosaic artist
const PLACEHOLDER_ARTWORKS = [
  {
    id: "1",
    title: "Fragmented Reality",
    medium: "Hand-cut Mosaic & Acrylic",
    dimensions: "24 x 36 in",
    price: 1200,
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80",
  },
  {
    id: "2",
    title: "Mosaic Dreams",
    medium: "Glass Tessellation on Canvas",
    dimensions: "30 x 40 in",
    price: 1800,
    imageUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&q=80",
  },
  {
    id: "3",
    title: "Chromatic Puzzle",
    medium: "Mixed Media Mosaic",
    dimensions: "18 x 24 in",
    price: 950,
    imageUrl: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=600&q=80",
  },
  {
    id: "4",
    title: "Shattered Light",
    medium: "Stained Glass & Resin",
    dimensions: "36 x 48 in",
    price: 2400,
    imageUrl: "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=600&q=80",
  },
  {
    id: "5",
    title: "Tessellated Horizon",
    medium: "Ceramic Tile Mosaic",
    dimensions: "20 x 30 in",
    price: 1100,
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
  },
  {
    id: "6",
    title: "Pixel Garden",
    medium: "Hand-cut Stone & Glass",
    dimensions: "28 x 28 in",
    price: 1650,
    imageUrl: "https://images.unsplash.com/photo-1482160549825-59d1b23cb208?w=600&q=80",
  },
];

interface ArtistSettings {
  display_name: string;
  artist_bio?: string | null;
  avatar_url?: string | null;
  contact_email?: string | null;
}

interface ArtistProfileProps {
  artistSettings?: ArtistSettings;
}

export default function ArtistProfile({ artistSettings }: ArtistProfileProps) {
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<typeof PLACEHOLDER_ARTWORKS[0] | null>(null);
  const [activeSection, setActiveSection] = useState<"works" | "about" | "contact">("works");

  const handleInquire = (artwork: typeof PLACEHOLDER_ARTWORKS[0]) => {
    setSelectedArtwork(artwork);
    setInquiryModalOpen(true);
  };

  const handleContactClick = () => {
    setSelectedArtwork(null);
    setInquiryModalOpen(true);
  };

  const artistName = artistSettings?.display_name || "Hya";
  const artistBio = artistSettings?.artist_bio;

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
          <ArtworkGrid 
            artworks={PLACEHOLDER_ARTWORKS} 
            onInquire={handleInquire}
          />
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
                  {artistName} is a contemporary mosaic artist whose work explores the intersection of 
                  fragmentation and unity. Each piece is meticulously hand-cut and assembled, 
                  transforming broken materials into cohesive visual narratives.
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
        artwork={selectedArtwork}
      />
    </div>
  );
}
