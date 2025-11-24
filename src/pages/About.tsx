import { Navbar } from "@/components/Navbar";
import { useArtistSettings } from "@/contexts/ArtistSettingsContext";
import { StudioGallery } from "@/components/StudioGallery";
import { TextSkeleton } from "@/components/TextSkeleton";
import { ImageWithDarkMode } from "@/components/ImageWithDarkMode";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function About() {
  const { settings, loading } = useArtistSettings();
  const navigate = useNavigate();

  const showBioSkeleton = loading || !settings?.artist_bio;
  const showStatementSkeleton = loading || !settings?.artist_statement;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Header - Left Aligned, Side-by-Side Layout */}
      <section className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            {/* Artist Photo - 150px Square */}
            <div className="w-[150px] h-[150px] flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              {loading ? (
                <div className="w-full h-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer" />
              ) : settings?.avatar_url ? (
                <ImageWithDarkMode 
                  src={settings.avatar_url} 
                  alt={settings.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted via-muted-foreground/5 to-muted">
                  <div className="text-5xl font-light text-muted-foreground/40">
                    {settings?.display_name?.charAt(0) || "A"}
                  </div>
                </div>
              )}
            </div>

            {/* Name & Elevator Pitch */}
            <div className="flex-1 space-y-4">
              {loading ? (
                <>
                  <div className="h-10 w-64 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer rounded" />
                  <div className="h-6 w-96 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer rounded" />
                </>
              ) : (
                <>
                  <h1 className="text-4xl lg:text-5xl font-light tracking-wide">
                    {settings?.display_name || "Artist Name"}
                  </h1>

                  {settings?.elevator_pitch && (
                    <p className="text-lg lg:text-xl text-muted-foreground font-normal leading-relaxed max-w-3xl">
                      {settings.elevator_pitch}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="border-t border-border" />
        </div>
      </div>

      {/* Bio & Statement Section - Left Aligned with Hero */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Left Column: Artist Biography */}
            <div className="space-y-6">
              {/* Section Title - Larger, Bolder, Left-Aligned */}
              <h2 className="text-3xl font-semibold tracking-tight text-left">
                Biography
              </h2>

              {/* Body Text with Comfortable Line Height and Max Width */}
              <div className="text-lg leading-relaxed text-foreground/90 space-y-4 max-w-prose">
                {showBioSkeleton ? (
                  <TextSkeleton lines={4} />
                ) : (
                  settings?.artist_bio?.split('\n').map((paragraph, idx) => (
                    paragraph.trim() && (
                      <p key={idx}>{paragraph}</p>
                    )
                  ))
                )}
              </div>

              {/* View CV Button - Text Link at Bottom of Bio Column */}
              {!loading && (
                <button
                  onClick={() => navigate('/cv')}
                  className="group inline-flex items-center text-base text-foreground/70 hover:text-foreground transition-colors mt-8 relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-foreground after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
                >
                  View Full CV & Press
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              )}
            </div>

            {/* Right Column: Art Practice/Statement */}
            <div className="space-y-6">
              {/* Section Title - Larger, Bolder, Left-Aligned */}
              <h2 className="text-3xl font-semibold tracking-tight text-left">
                Art Practice
              </h2>

              {/* Body Text with Comfortable Line Height and Max Width */}
              <div className="text-lg leading-relaxed text-foreground/90 space-y-4 max-w-prose">
                {showStatementSkeleton ? (
                  <TextSkeleton lines={4} />
                ) : (
                  settings?.artist_statement?.split('\n').map((paragraph, idx) => (
                    paragraph.trim() && (
                      <p key={idx}>{paragraph}</p>
                    )
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Studio Gallery */}
      <StudioGallery />
    </div>
  );
}
