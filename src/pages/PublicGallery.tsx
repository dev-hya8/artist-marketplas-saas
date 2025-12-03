import { useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ArtistProfile from "./ArtistProfile";
import { Loader2 } from "lucide-react";

export default function PublicGallery() {
  const { handle } = useParams<{ handle: string }>();

  const { data: artistSettings, isLoading, error } = useQuery({
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !artistSettings) {
    return <Navigate to="/404" replace />;
  }

  // Pass the artist settings to the profile page
  return <ArtistProfile artistSettings={artistSettings} />;
}
