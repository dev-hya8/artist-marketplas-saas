import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Upload, User, MessageSquare, Settings, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArtworkCard } from "@/components/ArtworkCard";
import { AddArtworkDrawer } from "@/components/AddArtworkDrawer";
import { EditArtworkDrawer } from "@/components/EditArtworkDrawer";
import { SettingsTab } from "@/components/admin/SettingsTab";
import { InquiriesTab, useUnreadInquiriesCount } from "@/components/admin/InquiriesTab";
import { ArtistProfileDrawer } from "@/components/admin/ArtistProfileDrawer";
import { useToast } from "@/hooks/use-toast";
import { useCurrency, CURRENCIES } from "@/contexts/CurrencyContext";
import type { Tables } from "@/integrations/supabase/types";

type Artwork = Tables<"artworks">;

const Index = () => {
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("artworks");
  const [profileDrawerClosing, setProfileDrawerClosing] = useState(false);
  const { toast } = useToast();
  const { data: unreadCount = 0 } = useUnreadInquiriesCount();
  const { currencyCode, setCurrency } = useCurrency();

  // Fetch artist avatar
  const fetchArtistAvatar = async () => {
    try {
      const { data, error } = await supabase
        .from("artist_settings")
        .select("avatar_url")
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error("Error fetching artist avatar:", error);
    }
  };

  const { data: artworks, isLoading, refetch } = useQuery({
    queryKey: ["artworks"],
    queryFn: async () => {
      // Fetch avatar on component mount
      fetchArtistAvatar();
      
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

  const handleProfileClose = (shouldClose: boolean) => {
    if (shouldClose) {
      setActiveTab("artworks");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 
                className="text-2xl font-bold cursor-pointer hover:opacity-70 transition-opacity" 
                onClick={() => setActiveTab("artworks")}
              >
                Artist Dashboard
              </h1>
              
              <div className="flex items-center gap-2">
                {/* Currency Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                    >
                      <Globe className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {CURRENCIES.map((currency) => (
                      <DropdownMenuItem
                        key={currency.code}
                        onClick={() => setCurrency(currency.code)}
                        className={currencyCode === currency.code ? "bg-accent" : ""}
                      >
                        {currency.name} ({currency.symbol})
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Profile Avatar - Direct Navigation */}
                <Button 
                  variant={activeTab === "profile" ? "default" : "outline"}
                  size="icon"
                  className="relative h-10 w-10"
                  onClick={() => setActiveTab("profile")}
                >
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Artist avatar" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>

                {/* Message/Inquiries Icon */}
              <Button
                variant={activeTab === "inquiries" ? "default" : "outline"}
                size="icon"
                className="relative h-10 w-10"
                onClick={() => setActiveTab("inquiries")}
              >
                <MessageSquare className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>

              {/* Settings Icon */}
              <Button
                variant={activeTab === "settings" ? "default" : "outline"}
                size="icon"
                className="h-10 w-10"
                onClick={() => setActiveTab("settings")}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="artworks">
            {isLoading ? (
              <div className="flex justify-center items-center min-h-[50vh]">
                <p className="text-muted-foreground">Loading artworks...</p>
              </div>
            ) : artworks && artworks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
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
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0 h-8 w-8"
                onClick={() => setActiveTab("artworks")}
              >
                <X className="h-4 w-4" />
              </Button>
              <InquiriesTab />
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <ArtistProfileDrawer
              open={true}
              onOpenChange={handleProfileClose}
              avatarUrl={avatarUrl}
              onAvatarUpdate={setAvatarUrl}
            />
          </TabsContent>

          <TabsContent value="settings">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0 h-8 w-8"
                onClick={() => setActiveTab("artworks")}
              >
                <X className="h-4 w-4" />
              </Button>
              <SettingsTab />
            </div>
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
    </div>
  );
};

export default Index;
