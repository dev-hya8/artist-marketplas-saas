import { useState } from "react";
import { cn } from "@/lib/utils";

interface Artwork {
  id: string;
  title: string;
  medium: string;
  dimensions: string;
  price: number;
  imageUrl: string;
}

interface ArtworkGridProps {
  artworks: Artwork[];
  onInquire: (artwork: Artwork) => void;
}

export function ArtworkGrid({ artworks, onInquire }: ArtworkGridProps) {
  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
      {artworks.map((artwork) => (
        <ArtworkCard 
          key={artwork.id} 
          artwork={artwork} 
          onInquire={() => onInquire(artwork)}
        />
      ))}
    </div>
  );
}

function ArtworkCard({ 
  artwork, 
  onInquire 
}: { 
  artwork: Artwork; 
  onInquire: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(artwork.price);

  return (
    <div 
      className="break-inside-avoid group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onInquire}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden bg-neutral-100">
        {!isLoaded && (
          <div className="absolute inset-0 bg-neutral-100 animate-pulse" />
        )}
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          onLoad={() => setIsLoaded(true)}
          className={cn(
            "w-full h-auto object-cover transition-all duration-500",
            isLoaded ? "opacity-100" : "opacity-0",
            isHovered ? "scale-105" : "scale-100"
          )}
        />
        
        {/* Hover Overlay */}
        <div 
          className={cn(
            "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <button
            onClick={onInquire}
            className="px-6 py-3 bg-white text-neutral-900 text-sm tracking-wide uppercase hover:bg-neutral-100 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>

      {/* Card Details */}
      <div className="pt-4 pb-8 space-y-1">
        <h3 className="font-serif text-lg text-neutral-900">{artwork.title}</h3>
        <p className="text-sm text-neutral-500">{artwork.medium}</p>
        <p className="text-sm text-neutral-500">{artwork.dimensions}</p>
        <p className="text-base text-neutral-900 font-medium pt-1">{formattedPrice}</p>
      </div>
    </div>
  );
}
