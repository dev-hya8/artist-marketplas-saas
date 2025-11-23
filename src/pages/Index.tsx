import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArtworkCard } from "@/components/ArtworkCard";
import { AddArtworkDrawer } from "@/components/AddArtworkDrawer";
import { EditArtworkDrawer } from "@/components/EditArtworkDrawer";
import { SettingsTab } from "@/components/admin/SettingsTab";
import { InquiriesTab, useUnreadInquiriesCount } from "@/components/admin/InquiriesTab";
import { ArtistProfileDrawer } from "@/components/admin/ArtistProfileDrawer";
import { useToast } from "@/hooks/use-toast";
import { useCurrency, CURRENCIES } from "@/contexts/CurrencyContext";
import { User, Ruler } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Artwork = Tables<"artworks">;

const Index = () => {
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const { toast } = useToast();
  const { currencyCode, currencySymbol, setCurrency } = useCurrency();
  const { data: unreadCount = 0 } = useUnreadInquiriesCount();

  const { data: artworks, isLoading, refetch } = useQuery({
    queryKey: ["artworks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artworks")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Artwork[];
    },
  });

  const handleCardClick = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    setEditDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setEditDrawerOpen(false);
    setSelectedArtwork(null);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Artist Dashboard</h1>
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    {currencyCode} {currencySymbol}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border-border z-[100]">
                  {CURRENCIES.map((currency) => (
                    <DropdownMenuItem
                      key={currency.code}
                      onClick={() => setCurrency(currency.code)}
                      className={currencyCode === currency.code ? "bg-accent" : ""}
                    >
                      {currency.code} ({currency.symbol}) - {currency.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" className="gap-1">
                <Ruler className="h-3 w-3" />
                Unit of Measurement
              </Button>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setProfileDrawerOpen(true)}
              >
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="artworks" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="artworks">Artworks</TabsTrigger>
            <TabsTrigger value="inquiries" className="relative">
              Inquiries
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="artworks">
            {isLoading ? (
              <div className="flex justify-center items-center min-h-[50vh]">
                <p className="text-muted-foreground">Loading artworks...</p>
              </div>
            ) : artworks && artworks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {artworks.map((artwork) => (
                  <ArtworkCard
                    key={artwork.id}
                    artwork={artwork}
                    onClick={() => handleCardClick(artwork)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <p className="text-muted-foreground mb-4">No artworks yet</p>
                <Button onClick={() => setAddDrawerOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Artwork
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="inquiries">
            <InquiriesTab />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Action Button */}
      <Button
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        onClick={() => setAddDrawerOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <AddArtworkDrawer
        open={addDrawerOpen}
        onOpenChange={setAddDrawerOpen}
        onSuccess={refetch}
      />

      {selectedArtwork && (
        <EditArtworkDrawer
          open={editDrawerOpen}
          onOpenChange={setEditDrawerOpen}
          artwork={selectedArtwork}
          onSuccess={refetch}
          onClose={handleDrawerClose}
        />
      )}

      <ArtistProfileDrawer
        open={profileDrawerOpen}
        onOpenChange={setProfileDrawerOpen}
      />
    </div>
  );
};

export default Index;
