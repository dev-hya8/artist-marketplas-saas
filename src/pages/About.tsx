import { Navbar } from "@/components/Navbar";
import { useArtistSettings } from "@/contexts/ArtistSettingsContext";
import { Button } from "@/components/ui/button";
import { StudioGallery } from "@/components/StudioGallery";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function About() {
  const { settings, loading } = useArtistSettings();
  const navigate = useNavigate();

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
      
      {/* Hero Header */}
      <section className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Artist Photo */}
          <div className="w-48 h-48 mx-auto rounded-full overflow-hidden bg-muted">
            {settings?.avatar_url ? (
              <img 
                src={settings.avatar_url} 
                alt={settings.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                <div className="text-6xl font-light text-muted-foreground">
                  {settings?.display_name?.charAt(0) || "A"}
                </div>
              </div>
            )}
          </div>

          {/* Artist Name */}
          <h1 className="text-4xl lg:text-5xl font-light tracking-wide">
            {settings?.display_name || "Artist Name"}
          </h1>

          {/* Elevator Pitch */}
          {settings?.elevator_pitch && (
            <p className="text-xl lg:text-2xl text-muted-foreground font-light leading-relaxed max-w-3xl mx-auto">
              {settings.elevator_pitch}
            </p>
          )}
        </div>
      </section>

      {/* Bio & Statement Section */}
      <section className="container mx-auto px-4 py-16 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left Column: Artist Biography */}
            <div className="space-y-6">
              <h2 className="text-2xl font-light tracking-wide border-b border-border pb-4">
                Biography
              </h2>
              <div className="text-lg leading-relaxed text-foreground/90 space-y-4">
                {settings?.artist_bio ? (
                  settings.artist_bio.split('\n').map((paragraph, idx) => (
                    paragraph.trim() && (
                      <p key={idx}>{paragraph}</p>
                    )
                  ))
                ) : (
                  <p className="text-muted-foreground italic">Biography content coming soon.</p>
                )}
              </div>
            </div>

            {/* Right Column: Art Practice/Statement */}
            <div className="space-y-6">
              <h2 className="text-2xl font-light tracking-wide border-b border-border pb-4">
                Art Practice
              </h2>
              <div className="text-lg leading-relaxed text-foreground/90 space-y-4">
                {settings?.artist_statement ? (
                  settings.artist_statement.split('\n').map((paragraph, idx) => (
                    paragraph.trim() && (
                      <p key={idx}>{paragraph}</p>
                    )
                  ))
                ) : (
                  <p className="text-muted-foreground italic">Artist statement coming soon.</p>
                )}
              </div>
            </div>
          </div>

          {/* View CV Button */}
          <div className="mt-12 flex justify-center">
            <Button 
              onClick={() => navigate('/cv')}
              variant="outline"
              size="lg"
              className="group"
            >
              View Full CV & Press
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Studio Gallery */}
      <StudioGallery />
    </div>
  );
}
