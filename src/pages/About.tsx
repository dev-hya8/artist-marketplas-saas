import { Navbar } from "@/components/Navbar";
import { useArtistSettings } from "@/contexts/ArtistSettingsContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail } from "lucide-react";
import { FaFacebook, FaTwitter, FaTiktok, FaInstagram } from "react-icons/fa";

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

  // Parse upcoming events
  const parseUpcomingEvents = (text: string | null) => {
    if (!text) return [];
    return text.split('\n').filter(line => line.trim());
  };

  const exhibitions = parseExhibitions(settings?.cv_exhibitions || null);
  const upcomingEvents = parseUpcomingEvents(settings?.upcoming_events || null);

  const socialLinks = [
    { 
      icon: FaFacebook, 
      url: settings?.facebook_handle, 
      label: "Facebook",
      color: "hover:text-blue-600"
    },
    { 
      icon: FaTwitter, 
      url: settings?.twitter_handle, 
      label: "Twitter",
      color: "hover:text-sky-500"
    },
    { 
      icon: FaInstagram, 
      url: settings?.instagram_handle, 
      label: "Instagram",
      color: "hover:text-pink-600"
    },
    { 
      icon: FaTiktok, 
      url: settings?.tiktok_handle, 
      label: "TikTok",
      color: "hover:text-foreground"
    },
  ].filter(social => social.url);

  const handleContact = () => {
    if (settings?.contact_email) {
      window.location.href = `mailto:${settings.contact_email}`;
    } else {
      window.location.href = '/contact';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[30%_70%] gap-8 lg:gap-12">
            {/* LEFT COLUMN: Artist Identity */}
            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {/* Profile Photo */}
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted">
                {settings?.avatar_url ? (
                  <img 
                    src={settings.avatar_url} 
                    alt={settings.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                    <div className="text-center p-8">
                      <div className="text-6xl font-light text-muted-foreground">
                        {settings?.display_name?.charAt(0) || "A"}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Artist Name */}
              <div className="text-center lg:text-left">
                <h1 className="text-3xl lg:text-4xl font-light tracking-wide mb-2">
                  {settings?.display_name || "Artist Name"}
                </h1>
              </div>

              {/* Social Media Icons */}
              {socialLinks.length > 0 && (
                <div className="flex gap-4 justify-center lg:justify-start">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={social.label}
                        href={social.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-muted-foreground transition-colors ${social.color}`}
                        aria-label={social.label}
                      >
                        <Icon className="h-6 w-6" />
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Contact Button */}
              <Button 
                onClick={handleContact}
                variant="default" 
                className="w-full"
                size="lg"
              >
                <Mail className="h-4 w-4 mr-2" />
                Get in Touch
              </Button>

              <Separator />
            </div>

            {/* RIGHT COLUMN: Story & Career */}
            <div className="space-y-12">
              {/* Section A: Bio */}
              {settings?.bio_text && (
                <div className="space-y-4">
                  <div 
                    className="text-lg leading-relaxed font-serif text-foreground/90"
                    style={{ lineHeight: '1.8' }}
                  >
                    {settings.bio_text.split('\n').map((paragraph, idx) => (
                      paragraph.trim() && (
                        <p key={idx} className="mb-4">
                          {paragraph}
                        </p>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Section B: Upcoming Events */}
              {upcomingEvents.length > 0 && (
                <Card className="p-6 border-2 border-primary/20 bg-primary/5">
                  <h2 className="text-2xl font-light tracking-wide mb-4">
                    Upcoming Events
                  </h2>
                  <ul className="space-y-3">
                    {upcomingEvents.map((event, idx) => (
                      <li key={idx} className="text-foreground/80">
                        {event}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Section C: CV / Exhibitions Timeline */}
              {exhibitions.length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-light tracking-wide pb-3 border-b">
                    Selected Exhibitions
                  </h2>
                  <div className="space-y-4">
                    {exhibitions.map((exhibition, idx) => (
                      <div key={idx} className="flex gap-6 group">
                        {exhibition.year && (
                          <div className="w-16 flex-shrink-0 text-right">
                            <span className="text-sm font-bold text-muted-foreground">
                              {exhibition.year}
                            </span>
                          </div>
                        )}
                        <div className={exhibition.year ? "flex-1" : "flex-1 ml-0"}>
                          <p className="text-base text-foreground group-hover:text-primary transition-colors">
                            {exhibition.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional CV Sections */}
              {settings?.cv_education && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-light tracking-wide pb-3 border-b">
                    Education
                  </h2>
                  <div className="text-base leading-relaxed text-foreground/80 whitespace-pre-wrap">
                    {settings.cv_education}
                  </div>
                </div>
              )}

              {settings?.cv_awards && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-light tracking-wide pb-3 border-b">
                    Awards & Recognition
                  </h2>
                  <div className="text-base leading-relaxed text-foreground/80 whitespace-pre-wrap">
                    {settings.cv_awards}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
