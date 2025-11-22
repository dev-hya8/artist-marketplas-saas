import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface BidModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artworkId: string;
  artworkTitle: string;
  currentBid: number;
  minIncrement: number;
  onBidPlaced: () => void;
}

export const BidModal = ({
  open,
  onOpenChange,
  artworkId,
  artworkTitle,
  currentBid,
  minIncrement,
  onBidPlaced,
}: BidModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bidAmount: "",
    bidderName: "",
    email: "",
  });

  const minBid = currentBid + minIncrement;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bidAmount = parseFloat(formData.bidAmount);

      if (bidAmount < minBid) {
        toast({
          title: "Bid Too Low",
          description: `Your bid must be at least $${minBid.toLocaleString()}`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Get current artwork data
      const { data: artwork, error: fetchError } = await supabase
        .from("artworks")
        .select("bid_history, current_bid")
        .eq("id", artworkId)
        .single();

      if (fetchError) throw fetchError;

      // Create new bid entry
      const newBid = {
        bidder_name: formData.bidderName,
        email: formData.email,
        amount: bidAmount,
        timestamp: new Date().toISOString(),
      };

      // Update artwork with new bid
      const existingBids = Array.isArray(artwork.bid_history) ? artwork.bid_history : [];
      const updatedBidHistory = [...existingBids, newBid];

      const { error: updateError } = await supabase
        .from("artworks")
        .update({
          current_bid: bidAmount,
          bid_history: updatedBidHistory,
        })
        .eq("id", artworkId);

      if (updateError) throw updateError;

      toast({
        title: "Bid Placed Successfully",
        description: `Your bid of $${bidAmount.toLocaleString()} has been placed!`,
      });

      setFormData({ bidAmount: "", bidderName: "", email: "" });
      onOpenChange(false);
      onBidPlaced();
    } catch (error: any) {
      console.error("Error placing bid:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to place bid",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Place Bid on "{artworkTitle}"</DialogTitle>
          <DialogDescription>
            Current bid: ${currentBid.toLocaleString()} - Minimum bid: ${minBid.toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bidAmount">Your Bid ($) *</Label>
            <Input
              id="bidAmount"
              type="number"
              step="0.01"
              min={minBid}
              placeholder={minBid.toString()}
              value={formData.bidAmount}
              onChange={(e) => setFormData({ ...formData, bidAmount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bidderName">Display Name *</Label>
            <Input
              id="bidderName"
              value={formData.bidderName}
              onChange={(e) => setFormData({ ...formData, bidderName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Placing Bid..." : "Place Bid"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
