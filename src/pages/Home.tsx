import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InquiryModal } from "@/components/public/InquiryModal";
import { BidModal } from "@/components/public/BidModal";
import { AuctionTimer } from "@/components/public/AuctionTimer";
import { ArtworkCarousel } from "@/components/public/ArtworkCarousel";
import { PublicArtworkDrawer } from "@/components/public/PublicArtworkDrawer";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useArtistSettings } from "@/contexts/ArtistSettingsContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Eye } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Artwork = Database["public"]["Tables"]["artworks"]["Row"];

export default function Home() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [artworkDrawerOpen, setArtworkDrawerOpen] = useState(false);
  const { convertPrice, currencyCode, isRateFailed } = useCurrency();
  const { settings } = useArtistSettings();
  const { addToCart, isInCart } = useCart();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const viewMode = searchParams.get("view") || "buy-now";

  const formatDimensions = (dimensions: string | null) => {
    if (!dimensions) return null;
    const unit = settings?.measurement_unit || "in";
    return `${dimensions} ${unit}`;
  };

  useEffect(() => {
    fetchArtworks();
  }, []);

  // Debug: Log when currency changes and force re-render
  useEffect(() => {
    console.log('💱 Home page currency updated:', currencyCode, 'Rate Failed:', isRateFailed);
  }, [currencyCode, isRateFailed]);

  const fetchArtworks = async () => {
    try {
      const { data, error } = await supabase
        .from("artworks")
        .select("*")
        .order("status", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Sort: Available first, then others
      const sorted = data?.sort((a, b) => {
        if (a.status === "Available" && b.status !== "Available") return -1;
        if (a.status !== "Available" && b.status === "Available") return 1;
        return 0;
      });

      setArtworks(sorted || []);
    } catch (error) {
      console.error("Error fetching artworks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    setArtworkDrawerOpen(true);
  };

  const handleInquire = (artwork: Artwork) => {
    console.log("Inquire clicked", artwork.title);
    setSelectedArtwork(artwork);
    setInquiryModalOpen(true);
  };

  const handleBid = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    setBidModalOpen(true);
  };

  const handleAddToCart = (artwork: Artwork, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInCart(artwork.id)) {
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

  const fixedPriceArtworks = artworks.filter((a) => a.sale_type === "fixed");
  const auctionArtworks = artworks.filter((a) => a.sale_type === "auction");

  const isAuctionEnded = (endTime: string | null) => {
    if (!endTime) return false;
    return new Date(endTime) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-20 pb-12">
        {/* Buy Now View */}
        {viewMode === "buy-now" && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {fixedPriceArtworks.map((artwork) => (
                <Card 
                  key={artwork.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div 
                    className="aspect-square relative bg-muted cursor-pointer"
                    onClick={() => handleViewDetails(artwork)}
                  >
                    <ArtworkCarousel 
                      artworkId={artwork.id}
                      mainImageUrl={artwork.image_url}
                      artworkTitle={artwork.title}
                    />
                    
                    {artwork.status === "Sold" && (
                      <div className="absolute top-2 right-2 z-10">
                        <Badge className="bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 px-3 py-1 text-[10px] md:text-xs font-medium uppercase tracking-widest rounded-full">
                          Sold
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-3 md:p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm md:text-lg line-clamp-2">{artwork.title}</h3>
                      
                      {formatDimensions(artwork.dimensions) && (
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {formatDimensions(artwork.dimensions)}
                        </p>
                      )}

                      {artwork.status === "Available" && artwork.price && (
                        <>
                          <div className="pt-2 space-y-0.5">
                            <p className="text-base md:text-xl font-bold">
                              {convertPrice(Number(artwork.price), artwork.base_currency || "USD")}
                            </p>
                            {!isRateFailed && currencyCode !== (artwork.base_currency || "USD") && (
                              <p className="text-xs text-muted-foreground">
                                Listed as {artwork.base_currency || "USD"} {artwork.price.toLocaleString()}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-none w-12"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(artwork);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={isInCart(artwork.id) ? "secondary" : "default"}
                              size="sm"
                              className="flex-1"
                              onClick={(e) => handleAddToCart(artwork, e)}
                              disabled={isInCart(artwork.id)}
                            >
                              <ShoppingBag className="h-4 w-4 mr-2" />
                              {isInCart(artwork.id) ? "In Cart" : "Add to Cart"}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {fixedPriceArtworks.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                No fixed-price artworks available yet.
              </div>
            )}
          </div>
        )}

        {/* Auctions View */}
        {viewMode === "auctions" && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {auctionArtworks.map((artwork) => {
                const ended = isAuctionEnded(artwork.auction_end_time);
                
                return (
                  <Card 
                    key={artwork.id} 
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div 
                      className="aspect-square relative bg-muted cursor-pointer"
                      onClick={() => handleViewDetails(artwork)}
                    >
                      <ArtworkCarousel 
                        artworkId={artwork.id}
                        mainImageUrl={artwork.image_url}
                        artworkTitle={artwork.title}
                      />
                      
                      {ended && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge className="bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 px-3 py-1 text-[10px] md:text-xs font-medium uppercase tracking-widest rounded-full">
                            Ended
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-3 md:p-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm md:text-lg line-clamp-2">{artwork.title}</h3>
                        
                        {formatDimensions(artwork.dimensions) && (
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {formatDimensions(artwork.dimensions)}
                          </p>
                        )}

                        <div className="pt-2 space-y-2">
                          {artwork.current_bid && (
                            <div className="space-y-0.5">
                              <p className="text-base md:text-xl font-bold">
                                {convertPrice(Number(artwork.current_bid), artwork.base_currency || "USD")}
                              </p>
                              {!isRateFailed && currencyCode !== (artwork.base_currency || "USD") && (
                                <p className="text-xs text-muted-foreground">
                                  {artwork.base_currency || "USD"} {artwork.current_bid.toLocaleString()}
                                </p>
                              )}
                            </div>
                          )}
                          
                          {artwork.auction_end_time && !ended && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Time Left:</span>
                              <AuctionTimer 
                                endTime={artwork.auction_end_time} 
                                onExpire={() => fetchArtworks()}
                              />
                            </div>
                          )}

                          {ended ? (
                            <div className="space-y-2">
                              {artwork.winner_name && (
                                <p className="text-xs text-muted-foreground">
                                  Winner: {artwork.winner_name}
                                </p>
                              )}
                              <Button variant="outline" size="sm" disabled className="w-full">
                                Bidding Closed
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Button 
                                variant="default" 
                                size="sm"
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBid(artwork);
                                }}
                              >
                                Place Bid
                              </Button>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-none w-12"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(artwork);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant={isInCart(artwork.id) ? "secondary" : "outline"}
                                  size="sm"
                                  className="flex-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(artwork, e);
                                  }}
                                  disabled={isInCart(artwork.id)}
                                >
                                  <ShoppingBag className="h-4 w-4 mr-2" />
                                  {isInCart(artwork.id) ? "In Cart" : "Add to Cart"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {auctionArtworks.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                No auctions available yet.
              </div>
            )}
          </div>
        )}
      </main>

      <PublicArtworkDrawer
        artwork={selectedArtwork}
        open={artworkDrawerOpen}
        onOpenChange={setArtworkDrawerOpen}
      />

      {selectedArtwork && (
        <>
          <InquiryModal
            open={inquiryModalOpen}
            onOpenChange={setInquiryModalOpen}
            artworkId={selectedArtwork.id}
            artworkTitle={selectedArtwork.title}
          />
          
          {selectedArtwork.sale_type === "auction" && selectedArtwork.current_bid && selectedArtwork.min_bid_increment && (
            <BidModal
              open={bidModalOpen}
              onOpenChange={setBidModalOpen}
              artworkId={selectedArtwork.id}
              artworkTitle={selectedArtwork.title}
              currentBid={Number(selectedArtwork.current_bid)}
              minIncrement={Number(selectedArtwork.min_bid_increment)}
              onBidPlaced={() => fetchArtworks()}
            />
          )}
        </>
      )}
    </div>
  );
}
