import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ArtistProfile from "./ArtistProfile";
import NotFound from "./NotFound";
import { Loader2 } from "lucide-react";

export default function PublicGallery() {
  const { handle } = useParams<{ handle: string }>();

  // Debug log
  console.log("Public Profile Loaded for:", handle);

  // Fetch artist settings by handle
  const { data: artistSettings, isLoading: settingsLoading, error: settingsError } = useQuery({
    queryKey: ["artist-by-handle", handle],
    queryFn: async () => {
      if (!handle) return null;
      
      const { data, error } = await supabase
        .from("artist_settings")
        .select("*")
        .eq("handle", handle.toLowerCase())
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!handle,
  });

  // Fetch artworks for the artist (only available ones for public)
  const { data: artworks, isLoading: artworksLoading } = useQuery({
    queryKey: ["public-artworks", artistSettings?.user_id],
    queryFn: async () => {
      if (!artistSettings?.user_id) return [];
      
      const { data, error } = await supabase
        .from("artworks")
        .select("id, title, medium, dimensions, price, image_url")
        .eq("user_id", artistSettings.user_id)
        .neq("status", "Sold")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!artistSettings?.user_id,
  });

  const isLoading = settingsLoading || (artistSettings && artworksLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Render NotFound directly instead of navigating to /404
  if (settingsError || !artistSettings) {
    return <NotFound />;
  }

  // Pass the artist settings and artworks to the profile page
  return <ArtistProfile artistSettings={artistSettings} artworks={artworks || []} />;
}
