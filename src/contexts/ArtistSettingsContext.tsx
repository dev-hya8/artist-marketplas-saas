import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ArtistSettings {
  id: string;
  display_name: string;
  contact_email: string | null;
  currency_region: string;
  bio_text: string | null;
  bio_image_url: string | null;
  measurement_unit: string | null;
  phone_number: string | null;
  instagram_handle: string | null;
  facebook_handle: string | null;
  twitter_handle: string | null;
  primary_contact_method: string | null;
}

interface ArtistSettingsContextType {
  settings: ArtistSettings | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const ArtistSettingsContext = createContext<ArtistSettingsContextType | undefined>(undefined);

export const ArtistSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<ArtistSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("artist_settings")
        .select("*")
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error("Error fetching artist settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <ArtistSettingsContext.Provider value={{ settings, loading, refetch: fetchSettings }}>
      {children}
    </ArtistSettingsContext.Provider>
  );
};

export const useArtistSettings = () => {
  const context = useContext(ArtistSettingsContext);
  if (!context) {
    throw new Error("useArtistSettings must be used within ArtistSettingsProvider");
  }
  return context;
};
