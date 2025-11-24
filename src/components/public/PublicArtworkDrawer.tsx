import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { X, ShoppingBag, Mail } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCart } from "@/contexts/CartContext";
import { useArtistSettings } from "@/contexts/ArtistSettingsContext";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Artwork = Database["public"]["Tables"]["artworks"]["Row"];

interface PublicArtworkDrawerProps {
  artwork: Artwork | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PublicArtworkDrawer = ({ artwork, open, onOpenChange }: PublicArtworkDrawerProps) => {
  const { convertPrice, currencyCode } = useCurrency();
  const { addToCart, isInCart } = useCart();
  const { settings } = useArtistSettings();
  const { toast } = useToast();

  if (!artwork) return null;

  const price = artwork.sale_type === "auction" ? artwork.current_bid : artwork.price;
  const isAvailable = artwork.status === "Available";
  const inCart = isInCart(artwork.id);

  const handleAddToCart = () => {
    if (inCart) {
      toast({
        title: "Already in cart",
        description: `"${artwork.title}" is already in your collection.`,
        variant: "destructive",
      });
      return;
    }
    addToCart(artwork);
    toast({
      title: "Added to cart",
      description: `"${artwork.title}" has been added to your collection.`,
    });
  };

  const handleInquire = () => {
    if (settings?.contact_email) {
      const subject = encodeURIComponent(`Inquiry about "${artwork.title}"`);
      const body = encodeURIComponent(
        `Hello,\n\nI am interested in learning more about "${artwork.title}".\n\nBest regards`
      );
      window.location.href = `mailto:${settings.contact_email}?subject=${subject}&body=${body}`;
    } else {
      window.location.href = '/contact';
    }
  };

  const formatDimensions = () => {
    if (!artwork.dimensions) return null;
    const unit = artwork.dimension_unit || settings?.measurement_unit || "in";
    return `${artwork.dimensions} ${unit}`;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-50 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Large Image */}
          <div className="relative w-full aspect-[4/3] bg-muted">
            {artwork.image_url ? (
              <img
                src={artwork.image_url}
                alt={artwork.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No image available
              </div>
            )}
            {!isAvailable && (
              <Badge className="absolute top-4 left-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 px-4 py-2 text-sm font-medium uppercase tracking-widest">
                {artwork.status}
              </Badge>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* Title, Year, Price */}
            <div className="space-y-2">
              <DrawerHeader className="p-0">
                <DrawerTitle className="text-3xl font-light tracking-wide">
                  {artwork.title}
                </DrawerTitle>
              </DrawerHeader>
              
              {artwork.creation_year && (
                <p className="text-muted-foreground text-lg">
                  {artwork.creation_year}
                </p>
              )}

              {isAvailable && price && (
                <div className="pt-2">
                  <p className="text-4xl font-bold">
                    {convertPrice(Number(price), artwork.base_currency || "USD")}
                  </p>
                  {artwork.sale_type === "auction" && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Current bid
                    </p>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* About the Work */}
            {artwork.description && (
              <div className="space-y-3">
                <h3 className="text-xl font-light tracking-wide">About the Work</h3>
                <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap font-serif">
                  {artwork.description}
                </p>
              </div>
            )}

            {/* Specs */}
            <div className="space-y-3">
              <h3 className="text-xl font-light tracking-wide">Specifications</h3>
              <dl className="space-y-2">
                {artwork.medium && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Medium</dt>
                    <dd className="font-medium">{artwork.medium}</dd>
                  </div>
                )}
                {formatDimensions() && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Dimensions</dt>
                    <dd className="font-medium">{formatDimensions()}</dd>
                  </div>
                )}
                {artwork.location && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Location</dt>
                    <dd className="font-medium">{artwork.location}</dd>
                  </div>
                )}
                {artwork.creation_year && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Year</dt>
                    <dd className="font-medium">{artwork.creation_year}</dd>
                  </div>
                )}
              </dl>
            </div>

            {artwork.provenance_log && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-xl font-light tracking-wide">Provenance</h3>
                  <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                    {artwork.provenance_log}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sticky Footer with Action Buttons */}
        <DrawerFooter className="border-t bg-background">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={handleInquire}
            >
              <Mail className="h-4 w-4 mr-2" />
              Inquire
            </Button>
            {isAvailable && (
              <Button
                variant="default"
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={inCart}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                {inCart ? "In Cart" : "Add to Cart"}
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
