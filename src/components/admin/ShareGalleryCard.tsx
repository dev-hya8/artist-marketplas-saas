import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, ExternalLink, Check, Link2 } from "lucide-react";

interface ShareGalleryCardProps {
  handle: string;
}

export const ShareGalleryCard = ({ handle }: ShareGalleryCardProps) => {
  const [copied, setCopied] = useState(false);
  
  const fullUrl = `artha.co/artist/${handle}`;
  const liveUrl = `${window.location.origin}/artist/${handle}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleViewLive = () => {
    window.open(`${window.location.origin}/gallery`, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border-green-500/20">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Icon and Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Link2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-green-500 uppercase tracking-wide">
                  Gallery Live
                </span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <p className="text-lg font-semibold">{fullUrl}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 sm:ml-auto">
            <Button
              variant="outline"
              onClick={handleCopy}
              className="flex-1 sm:flex-none"
            >
              {copied ? (
                <Check className="mr-2 h-4 w-4 text-green-500" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
            <Button
              onClick={handleViewLive}
              className="flex-1 sm:flex-none"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Live Gallery
            </Button>
          </div>
        </div>

        {/* Tip */}
        <p className="mt-4 text-sm text-muted-foreground">
          Paste this link in your Instagram bio to start selling.
        </p>
      </CardContent>
    </Card>
  );
};
