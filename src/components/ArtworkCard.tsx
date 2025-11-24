import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useArtistSettings } from "@/contexts/ArtistSettingsContext";
import { Image } from "lucide-react";
import { getSafeImageUrl } from "@/lib/imageUtils";
import type { Tables } from "@/integrations/supabase/types";

type Artwork = Tables<"artworks">;

interface ArtworkCardProps {
  artwork: Artwork;
  onClick: () => void;
}

const statusColors = {
  Available: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20",
  Sold: "bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20",
  "On Loan": "bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20",
  Reserved: "bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20",
};

export const ArtworkCard = ({ artwork, onClick }: ArtworkCardProps) => {
  const { convertPrice, currencyCode, isRateFailed } = useCurrency();
  const { settings } = useArtistSettings();
  const [imageError, setImageError] = useState(false);
  
  // Debug: Log the artwork image URL
  console.log('Artwork URL being rendered:', artwork.image_url);
  console.log('🔍 FULL ARTWORK DATA:', artwork);
  console.log('🔧 Safe URL Result:', getSafeImageUrl(artwork.image_url));
  
  // Debug: Log currency context on every render
  console.log(`🔄 ArtworkCard [${artwork.title}] - Currency Context is NOW: ${currencyCode}, Rate Failed: ${isRateFailed}`);
  
  // Debug: Log when currency changes
  useEffect(() => {
    console.log(`✅ ArtworkCard [${artwork.title}] - Currency CHANGED to: ${currencyCode}`);
  }, [currencyCode]);
  
  const formatDimensions = () => {
    if (!artwork.dimensions) return null;
    const unit = settings?.measurement_unit || "in";
    return `${artwork.dimensions} ${unit}`;
  };
  
  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="aspect-square relative bg-muted">
        {artwork.image_url && !imageError ? (
          <img
            src={getSafeImageUrl(artwork.image_url) || ''}
            alt={artwork.title}
            className="w-full h-full object-cover"
            onError={() => {
              console.error('Image failed to load:', artwork.image_url);
              setImageError(true);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Image className="h-12 w-12 opacity-40" />
          </div>
        )}
      </div>
      <CardContent className="p-3 md:p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-sm md:text-lg line-clamp-2">{artwork.title}</h3>
            {formatDimensions() && (
              <p className="text-xs md:text-sm text-muted-foreground">{formatDimensions()}</p>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            {artwork.price ? (
              <>
                {/* Main Price: User's Preferred Currency */}
                <p className="text-base md:text-xl font-bold">
                  {convertPrice(Number(artwork.price), artwork.base_currency || "USD")}
                </p>
                {/* Sub Text: Original Listed Price (if different) */}
                {!isRateFailed && currencyCode !== (artwork.base_currency || "USD") && (
                  <p className="text-xs text-muted-foreground">
                    Listed as {artwork.base_currency || "USD"} {artwork.price.toLocaleString()}
                  </p>
                )}
              </>
            ) : (
              <p className="text-base md:text-xl font-bold">N/A</p>
            )}
          </div>
          <Badge className={`${statusColors[artwork.status]} px-3 py-1 text-[10px] md:text-xs font-medium uppercase tracking-widest rounded-full shrink-0`}>
            {artwork.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
