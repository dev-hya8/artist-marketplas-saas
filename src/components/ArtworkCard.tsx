import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-2">{artwork.title}</h3>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xl font-bold">
            {artwork.price ? `$${artwork.price.toLocaleString()}` : "N/A"}
          </p>
          <Badge className={statusColors[artwork.status]}>{artwork.status}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};
