import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InquiryModal } from "@/components/public/InquiryModal";
import { BidModal } from "@/components/public/BidModal";
import { AuctionTimer } from "@/components/public/AuctionTimer";
import { ArtworkCarousel } from "@/components/public/ArtworkCarousel";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useArtistSettings } from "@/contexts/ArtistSettingsContext";
import type { Database } from "@/integrations/supabase/types";

type Artwork = Database["public"]["Tables"]["artworks"]["Row"];

export default function Home() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const { convertPrice, currencyCode } = useCurrency();
  const { settings } = useArtistSettings();

  const formatDimensions = (dimensions: string | null) => {
    if (!dimensions) return null;
    const unit = settings?.measurement_unit || "in";
    return `${dimensions} ${unit}`;
  };

  useEffect(() => {
    fetchArtworks();
  }, []);

  // Refetch when currency changes to trigger re-render with new prices
  useEffect(() => {
    if (artworks.length > 0) {
      // Trigger re-render when currency changes
      setArtworks([...artworks]);
    }
  }, [currencyCode]);

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

  const handleInquire = (artwork: Artwork) => {
    console.log("Inquire clicked", artwork.title);
    setSelectedArtwork(artwork);
    setInquiryModalOpen(true);
  };

  const handleBid = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    setBidModalOpen(true);
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
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Tabs defaultValue="buy-now" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="buy-now">Buy Now</TabsTrigger>
            <TabsTrigger value="auctions">Auctions</TabsTrigger>
          </TabsList>

          <TabsContent value="buy-now">
            <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
              {fixedPriceArtworks.map((artwork) => (
                <div key={artwork.id} className="break-inside-avoid group">
                  <div className="relative mb-4">
                    <ArtworkCarousel 
                      artworkId={artwork.id}
                      mainImageUrl={artwork.image_url}
                      artworkTitle={artwork.title}
                    />
                    
                    {artwork.status === "Sold" && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                          <span className="text-xs font-medium text-destructive">SOLD</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-light tracking-wide">{artwork.title}</h3>
                    
                    {formatDimensions(artwork.dimensions) && (
                      <p className="text-sm text-muted-foreground font-light">
                        {formatDimensions(artwork.dimensions)}
                      </p>
                    )}

                    {artwork.status === "Available" && (
                      <div className="flex items-center justify-between pt-2">
                        {artwork.price && (
                          <p className="text-base font-light">
                            {convertPrice(Number(artwork.price))}
                          </p>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="ml-auto"
                          onClick={() => handleInquire(artwork)}
                        >
                          Inquire
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {fixedPriceArtworks.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                No fixed-price artworks available yet.
              </div>
            )}
          </TabsContent>

          <TabsContent value="auctions">
            <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
              {auctionArtworks.map((artwork) => {
                const ended = isAuctionEnded(artwork.auction_end_time);
                
                return (
                  <div key={artwork.id} className="break-inside-avoid group">
                    <div className="relative mb-4">
                      <ArtworkCarousel 
                        artworkId={artwork.id}
                        mainImageUrl={artwork.image_url}
                        artworkTitle={artwork.title}
                      />
                      
                      {ended && (
                        <div className="absolute top-4 right-4 z-10">
                          <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                            <span className="text-xs font-medium text-destructive">ENDED</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-light tracking-wide">{artwork.title}</h3>
                      
                      {formatDimensions(artwork.dimensions) && (
                        <p className="text-sm text-muted-foreground font-light">
                          {formatDimensions(artwork.dimensions)}
                        </p>
                      )}

                      <div className="space-y-1 pt-2">
                        {artwork.current_bid && (
                          <p className="text-base font-light">
                            Current Bid: {convertPrice(Number(artwork.current_bid))}
                          </p>
                        )}
                        
                        {artwork.auction_end_time && !ended && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Time Left:</span>
                            <AuctionTimer 
                              endTime={artwork.auction_end_time} 
                              onExpire={() => fetchArtworks()}
                            />
                          </div>
                        )}

                        {ended ? (
                          <div className="pt-2">
                            <p className="text-sm text-destructive font-medium">
                              Auction Ended
                              {artwork.winner_name && ` - Winner: ${artwork.winner_name}`}
                            </p>
                            <Button variant="outline" size="sm" disabled className="mt-2 w-full">
                              Bidding Closed
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="default" 
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => handleBid(artwork)}
                          >
                            Place Bid
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {auctionArtworks.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                No auctions available yet.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

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
