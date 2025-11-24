import { Navbar } from "@/components/Navbar";
import { useArtistSettings } from "@/contexts/ArtistSettingsContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CV() {
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

  // Parse exhibitions into timeline format
  const parseExhibitions = (text: string | null) => {
    if (!text) return [];
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const match = line.match(/^(\d{4})\s*[-–—]\s*(.+)$/);
      if (match) {
        return { year: match[1], title: match[2].trim() };
      }
      return { year: '', title: line };
    });
  };

  const exhibitions = parseExhibitions(settings?.cv_exhibitions || null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button 
            onClick={() => navigate('/about')}
            variant="ghost" 
            className="mb-8 -ml-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to About
          </Button>

          {/* Page Title */}
          <div className="mb-16 space-y-4">
            <h1 className="text-4xl lg:text-5xl font-light tracking-wide">
              Curriculum Vitae
            </h1>
            <p className="text-xl text-muted-foreground">
              {settings?.display_name}
            </p>
          </div>

          {/* Exhibitions Section */}
          {exhibitions.length > 0 && (
            <section className="mb-16 space-y-8">
              <h2 className="text-3xl font-light tracking-wide pb-4 border-b-2 border-border">
                Exhibitions
              </h2>
              <div className="space-y-6">
                {exhibitions.map((exhibition, idx) => (
                  <div key={idx} className="flex gap-8 group">
                    {exhibition.year && (
                      <div className="w-20 flex-shrink-0 text-right">
                        <span className="text-base font-semibold text-muted-foreground">
                          {exhibition.year}
                        </span>
                      </div>
                    )}
                    <div className={exhibition.year ? "flex-1" : "flex-1 ml-0"}>
                      <p className="text-lg text-foreground group-hover:text-primary transition-colors leading-relaxed">
                        {exhibition.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education Section */}
          {settings?.cv_education && (
            <section className="mb-16 space-y-8">
              <h2 className="text-3xl font-light tracking-wide pb-4 border-b-2 border-border">
                Education
              </h2>
              <div className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {settings.cv_education}
              </div>
            </section>
          )}

          {/* Awards Section */}
          {settings?.cv_awards && (
            <section className="mb-16 space-y-8">
              <h2 className="text-3xl font-light tracking-wide pb-4 border-b-2 border-border">
                Awards & Recognition
              </h2>
              <div className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {settings.cv_awards}
              </div>
            </section>
          )}

          {/* Empty State */}
          {!exhibitions.length && !settings?.cv_education && !settings?.cv_awards && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">CV content will appear here once added.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
