import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check, ExternalLink, Sparkles } from "lucide-react";

export default function GalleryReady() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [artistName, setArtistName] = useState<string>("Artist");
  const [handle, setHandle] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchArtistInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data } = await supabase
        .from("artist_settings")
        .select("display_name, handle")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (data) {
        setArtistName(data.display_name || "Artist");
        setHandle(data.handle);
      }
      
      setLoading(false);
    };

    fetchArtistInfo();
  }, [navigate]);

  const fullUrl = handle ? `artha.co/artist/${handle}` : "";
  const liveUrl = handle ? `${window.location.origin}/artist/${handle}` : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${fullUrl}`);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Your gallery link is ready to share.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b py-4 px-6">
        <div className="flex items-center justify-center">
          <Link 
            to="/" 
            className="font-serif text-2xl tracking-tight text-foreground transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary rounded-md px-2 py-1"
          >
            Artha
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg text-center space-y-8">
          {/* Celebration Icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center animate-in zoom-in duration-500">
            <Sparkles className="h-10 w-10 text-green-500" />
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Your canvas is ready, {artistName}.
            </h2>
            <p className="text-lg text-muted-foreground">
              Your public gallery is live and ready for collectors.
            </p>
          </div>

          {/* URL Display Box */}
          {handle && (
            <div className="bg-muted/50 border rounded-xl p-6 space-y-4">
              <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
                Your Gallery URL
              </p>
              <p className="text-2xl md:text-3xl font-mono font-semibold text-foreground break-all">
                {fullUrl}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="h-11 px-6"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/gallery")}
                  className="h-11 px-6"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Gallery
                </Button>
              </div>
            </div>
          )}

          {/* Primary CTA */}
          <Button
            onClick={() => navigate("/admin")}
            size="lg"
            className="h-14 px-10 text-lg font-semibold"
          >
            Enter Dashboard & Upload Art
          </Button>

          <p className="text-sm text-muted-foreground">
            Start uploading your work to make it visible to collectors.
          </p>
        </div>
      </main>
    </div>
  );
}
