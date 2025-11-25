import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface InvoiceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDrawer({ open, onOpenChange }: InvoiceDrawerProps) {
  const { toast } = useToast();
  const [selectedArtworkId, setSelectedArtworkId] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [saleDate, setSaleDate] = useState<Date | undefined>(new Date());
  const [finalSalePrice, setFinalSalePrice] = useState("");
  const [shippingCost, setShippingCost] = useState("0.00");
  const [taxRate, setTaxRate] = useState("0");
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch available and sold artworks
  const { data: artworks } = useQuery({
    queryKey: ["artworks-for-invoice"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artworks")
        .select("*")
        .in("status", ["Available", "Sold"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleArtworkChange = (artworkId: string) => {
    setSelectedArtworkId(artworkId);
    const artwork = artworks?.find((a) => a.id === artworkId);
    if (artwork?.price) {
      setFinalSalePrice(artwork.price.toString());
    }
  };

  const handleGenerateInvoice = async () => {
    if (!selectedArtworkId || !clientName || !clientEmail || !clientAddress || !saleDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-invoice", {
        body: {
          artworkId: selectedArtworkId,
          clientName,
          clientEmail,
          clientAddress,
          saleDate: format(saleDate, "yyyy-MM-dd"),
          finalSalePrice: parseFloat(finalSalePrice),
          shippingCost: parseFloat(shippingCost),
          taxRate: parseFloat(taxRate),
        },
      });

      if (error) throw error;

      toast({
        title: "Invoice Generated",
        description: "Your invoice has been created successfully.",
      });

      // Open PDF in new tab
      if (data?.pdfUrl) {
        window.open(data.pdfUrl, "_blank");
      }

      // Reset form and close drawer
      setSelectedArtworkId("");
      setClientName("");
      setClientEmail("");
      setClientAddress("");
      setSaleDate(new Date());
      setFinalSalePrice("");
      setShippingCost("0.00");
      setTaxRate("0");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="fixed inset-y-0 right-0 left-auto h-screen w-full max-w-4xl border-l border-border bg-background rounded-none">
        <DrawerHeader className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-2xl font-bold text-foreground">
              Generate New Invoice
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-5 w-5" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-6 py-6 flex-1 bg-background">
          <div className="space-y-8 max-w-2xl mx-auto pb-24">
            {/* Artwork Selection */}
            <div className="space-y-3">
              <Label htmlFor="artwork" className="text-base font-semibold text-foreground">
                Artwork to Invoice *
              </Label>
              <Select value={selectedArtworkId} onValueChange={handleArtworkChange}>
                <SelectTrigger id="artwork" className="h-12 text-base">
                  <SelectValue placeholder="Select an artwork" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {artworks?.map((artwork) => (
                    <SelectItem key={artwork.id} value={artwork.id} className="text-base py-3">
                      {artwork.title} - {artwork.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client Details */}
            <div className="space-y-6 border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-foreground">Client Details</h3>
              
              <div className="space-y-3">
                <Label htmlFor="clientName" className="text-base font-semibold text-foreground">
                  Client Name *
                </Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="John Smith"
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="clientEmail" className="text-base font-semibold text-foreground">
                  Client Email *
                </Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="clientAddress" className="text-base font-semibold text-foreground">
                  Client Shipping Address *
                </Label>
                <Textarea
                  id="clientAddress"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="123 Main Street&#10;Apt 4B&#10;New York, NY 10001"
                  className="min-h-24 text-base"
                />
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-6 border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-foreground">Financial Details</h3>

              <div className="space-y-3">
                <Label htmlFor="saleDate" className="text-base font-semibold text-foreground">
                  Sale Date *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="saleDate"
                      variant="outline"
                      className={cn(
                        "w-full h-12 justify-start text-left font-normal text-base",
                        !saleDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      {saleDate ? format(saleDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background" align="start">
                    <Calendar
                      mode="single"
                      selected={saleDate}
                      onSelect={setSaleDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-3">
                <Label htmlFor="finalSalePrice" className="text-base font-semibold text-foreground">
                  Final Sale Price *
                </Label>
                <Input
                  id="finalSalePrice"
                  type="number"
                  step="0.01"
                  value={finalSalePrice}
                  onChange={(e) => setFinalSalePrice(e.target.value)}
                  placeholder="5000.00"
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="shippingCost" className="text-base font-semibold text-foreground">
                  Shipping Cost
                </Label>
                <Input
                  id="shippingCost"
                  type="number"
                  step="0.01"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  placeholder="0.00"
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="taxRate" className="text-base font-semibold text-foreground">
                  Tax Rate (%)
                </Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="0"
                  className="h-12 text-base"
                />
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky bottom-0">
          <div className="flex gap-3 max-w-2xl mx-auto w-full">
            <Button
              onClick={handleGenerateInvoice}
              disabled={isGenerating}
              className="flex-1 h-12 text-base font-semibold"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Invoice PDF"
              )}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}