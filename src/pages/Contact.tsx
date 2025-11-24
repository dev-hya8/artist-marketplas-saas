import { Navbar } from "@/components/Navbar";
import { ContactInfoCard } from "@/components/ContactInfoCard";
import { useArtistSettings } from "@/contexts/ArtistSettingsContext";

export default function Contact() {
  const { loading: settingsLoading } = useArtistSettings();

  if (settingsLoading) {
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
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-2xl mx-auto">
          <ContactInfoCard />
        </div>
      </main>
    </div>
  );
}
