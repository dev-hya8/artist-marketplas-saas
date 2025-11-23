import { Navbar } from "@/components/Navbar";
import { useArtistSettings } from "@/contexts/ArtistSettingsContext";

export default function About() {
  const { settings, loading } = useArtistSettings();

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
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-light tracking-wide mb-12">About</h1>
          
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Bio Image */}
            <div className="w-full">
              {settings?.bio_image_url ? (
                <img 
                  src={settings.bio_image_url} 
                  alt={settings.display_name}
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">No bio image set</p>
                </div>
              )}
            </div>

            {/* Bio Text */}
            <div className="space-y-6">
              <h2 className="text-2xl font-light tracking-wide">
                {settings?.display_name || "Artist Name"}
              </h2>
              
              {settings?.bio_text ? (
                <div className="prose prose-sm max-w-none text-foreground font-light leading-relaxed whitespace-pre-wrap">
                  {settings.bio_text}
                </div>
              ) : (
                <p className="text-muted-foreground font-light">
                  No bio text available. Please add one in the admin settings.
                </p>
              )}
            </div>
          </div>

          {/* CV Sections */}
          {(settings?.cv_exhibitions || settings?.cv_education || settings?.cv_awards) && (
            <div className="mt-16 space-y-12">
              {settings?.cv_exhibitions && (
                <div className="space-y-4">
                  <h3 className="text-xl font-light tracking-wide border-b pb-2">Exhibitions</h3>
                  <div className="prose prose-sm max-w-none text-foreground font-light leading-relaxed whitespace-pre-wrap">
                    {settings.cv_exhibitions}
                  </div>
                </div>
              )}

              {settings?.cv_education && (
                <div className="space-y-4">
                  <h3 className="text-xl font-light tracking-wide border-b pb-2">Education</h3>
                  <div className="prose prose-sm max-w-none text-foreground font-light leading-relaxed whitespace-pre-wrap">
                    {settings.cv_education}
                  </div>
                </div>
              )}

              {settings?.cv_awards && (
                <div className="space-y-4">
                  <h3 className="text-xl font-light tracking-wide border-b pb-2">Awards & Recognition</h3>
                  <div className="prose prose-sm max-w-none text-foreground font-light leading-relaxed whitespace-pre-wrap">
                    {settings.cv_awards}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
