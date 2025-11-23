import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useArtistSettings } from "@/contexts/ArtistSettingsContext";
import type { Tables } from "@/integrations/supabase/types";

type Artwork = Tables<"artworks">;

interface ArtworkCardProps {
  artwork: Artwork;
  onClick: () => void;
}

const statusColors = {
  Available: "bg-green-500 text-white hover:bg-green-600",
  Sold: "bg-red-500 text-white hover:bg-red-600",
  "On Loan": "bg-blue-500 text-white hover:bg-blue-600",
  Reserved: "bg-yellow-500 text-white hover:bg-yellow-600",
};

export const ArtworkCard = ({ artwork, onClick }: ArtworkCardProps) => {
  const { convertPrice, currencyCode, isRateFailed } = useCurrency();
  const { settings } = useArtistSettings();
  
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
        {artwork.image_url ? (
          <img
            src={artwork.image_url}
            alt={artwork.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image
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
          <Badge className={`${statusColors[artwork.status]} px-2 py-0.5 md:px-3 md:py-1 text-xs md:text-sm font-medium shrink-0`}>{artwork.status}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};
