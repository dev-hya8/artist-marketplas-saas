
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, User, MessageSquare, Settings, X, Globe, ChevronDown, DollarSign, List, Grid, Download } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ArtworkCard } from "@/components/ArtworkCard";
import { AddArtworkDrawer } from "@/components/AddArtworkDrawer";
import { EditArtworkDrawer } from "@/components/EditArtworkDrawer";
import { InvoiceDrawer } from "@/components/InvoiceDrawer";
import { TransactionWizard } from "@/components/TransactionWizard";
import { SettingsTab } from "@/components/admin/SettingsTab";
import { InquiriesTab, useUnreadInquiriesCount } from "@/components/admin/InquiriesTab";
import { ArtistProfileDrawer } from "@/components/admin/ArtistProfileDrawer";
import { ClaimHandleModal } from "@/components/admin/ClaimHandleModal";
import { ShareGalleryCard } from "@/components/admin/ShareGalleryCard";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useCurrency, CURRENCIES } from "@/contexts/CurrencyContext";
import type { Tables } from "@/integrations/supabase/types";

type Artwork = Tables<"artworks">;

const Index = () => {
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [invoiceDrawerOpen, setInvoiceDrawerOpen] = useState(false);
  const [transactionWizardOpen, setTransactionWizardOpen] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [artistHandle, setArtistHandle] = useState<string | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("artworks");
  const [viewMode, setViewMode] = useState<"table" | "gallery">("gallery");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [exportPopoverOpen, setExportPopoverOpen] = useState(false);
  const { toast } = useToast();
  const { data: unreadCount = 0 } = useUnreadInquiriesCount();
  const { currencyCode, setCurrency } = useCurrency();

  // Fetch artist settings including handle
  const fetchArtistSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("artist_settings")
        .select("avatar_url, handle")
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setAvatarUrl(data.avatar_url);
        setArtistHandle(data.handle);
        // Show modal if no handle is set
        if (!data.handle) {
          setShowClaimModal(true);
        }
      }
    } catch (error) {
      console.error("Error fetching artist settings:", error);
    }
  };

  const handleClaimSuccess = (handle: string) => {
    setArtistHandle(handle);
    setShowClaimModal(false);
  };

  const { data: artworks, isLoading, refetch } = useQuery({
    queryKey: ["artworks"],
    queryFn: async () => {
      // Fetch settings on component mount
      fetchArtistSettings();
      
      const { data, error } = await supabase
        .from("artworks")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Artwork[];
    },
  });

  // Filter artworks based on status
  const filteredArtworks = artworks?.filter(artwork => {
    if (statusFilter === "all") return true;
    return artwork.status === statusFilter;
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

  const handleExport = async (format: 'pdf' | 'docx') => {
    setExportPopoverOpen(false);
    
    try {
      toast({
        title: "Generating Export",
        description: `Creating ${format.toUpperCase()} document...`,
      });

      const { data, error } = await supabase.functions.invoke("export-inventory", {
        body: { format },
      });

      if (error) throw error;

      // The response is the file blob
      const blob = new Blob([data], { 
        type: format === 'pdf' 
          ? 'application/pdf' 
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-report-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Complete",
        description: `Your ${format.toUpperCase()} file has been downloaded.`,
      });
    } catch (error: any) {
      console.error("Error exporting inventory:", error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export inventory. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h1 
                    className="text-2xl font-bold cursor-pointer hover:opacity-70 transition-opacity" 
                    onClick={() => setActiveTab("artworks")}
                  >
                    Artist Dashboard
                  </h1>
                  
                  {/* Quick Gallery Link Widget */}
                  {artistHandle && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="hidden sm:flex items-center gap-2 h-8 px-3 text-xs font-medium bg-muted/50 hover:bg-muted"
                          onClick={() => window.open(`${window.location.origin}/${artistHandle}`, "_blank")}
                        >
                          <Globe className="h-3.5 w-3.5 text-green-500" />
                          <span className="text-muted-foreground">artha.co/</span>
                          <span className="font-semibold">{artistHandle}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>View your public gallery</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Currency Selector */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost"
                              className="h-9 px-3 gap-2 border border-border hover:bg-accent rounded-full"
                            >
                              <Globe className="h-4 w-4" />
                              <span className="font-semibold text-sm">{currencyCode}</span>
                              <ChevronDown className="h-3 w-3 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="z-50">
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
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Change Display Currency</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Theme Toggle */}
                  <ThemeToggle />

                  {/* Profile Avatar - Direct Navigation */}
                  <Tooltip>
                    <TooltipTrigger asChild>
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
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Edit Artist Profile</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Message/Inquiries Icon */}
                  <Tooltip>
                    <TooltipTrigger asChild>
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
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Inquiries & Messages</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Settings Icon */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={activeTab === "settings" ? "default" : "outline"}
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => setActiveTab("settings")}
                      >
                        <Settings className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>App Settings</p>
                    </TooltipContent>
                  </Tooltip>
              </div>
            </div>
          </div>
        </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="artworks" className="space-y-6">
            {/* Share Gallery Card - Show if handle exists */}
            {artistHandle && (
              <ShareGalleryCard handle={artistHandle} />
            )}

            {/* Action Bar - Main Controls */}
            <div className="flex gap-2 items-center w-full">
              <Button 
                variant={viewMode === "gallery" ? "default" : "secondary"}
                onClick={() => setViewMode("gallery")}
                size="lg"
                className="h-12 text-sm sm:text-base font-semibold px-3 sm:px-6 flex-1"
              >
                <Grid className="mr-1 sm:mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                <span className="hidden sm:inline">Gallery View</span>
                <span className="sm:hidden">Gallery</span>
              </Button>

              <Button 
                variant={viewMode === "table" ? "default" : "secondary"}
                onClick={() => setViewMode("table")}
                size="lg"
                className="h-12 text-sm sm:text-base font-semibold px-3 sm:px-6 flex-1"
              >
                <List className="mr-1 sm:mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                <span className="hidden sm:inline">My Inventory</span>
                <span className="sm:hidden">Inventory</span>
              </Button>

              <Button 
                variant="secondary"
                onClick={() => setTransactionWizardOpen(true)}
                size="lg"
                className="h-12 text-sm sm:text-base font-semibold px-3 sm:px-6 flex-1"
              >
                <DollarSign className="mr-1 sm:mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                <span className="hidden sm:inline">Manage Transaction</span>
                <span className="sm:hidden">Transaction</span>
              </Button>
            </div>

            {/* Status Filters - Only show in table view */}
            {viewMode === "table" && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                  size="sm"
                >
                  All Works
                </Button>
                <Button
                  variant={statusFilter === "Sold" ? "default" : "outline"}
                  onClick={() => setStatusFilter("Sold")}
                  size="sm"
                >
                  Sold
                </Button>
                <Button
                  variant={statusFilter === "Available" ? "default" : "outline"}
                  onClick={() => setStatusFilter("Available")}
                  size="sm"
                >
                  Available
                </Button>
                <Button
                  variant={statusFilter === "Reserved" ? "default" : "outline"}
                  onClick={() => setStatusFilter("Reserved")}
                  size="sm"
                >
                  Reserved
                </Button>
                <Button
                  variant={statusFilter === "On Loan" ? "default" : "outline"}
                  onClick={() => setStatusFilter("On Loan")}
                  size="sm"
                >
                  On Loan
                </Button>
              </div>
            )}

            {/* Inventory View - Table or Gallery */}
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-12 bg-muted rounded"></div>
                <div className="h-24 bg-muted rounded"></div>
                <div className="h-24 bg-muted rounded"></div>
              </div>
            ) : filteredArtworks && filteredArtworks.length > 0 ? (
              viewMode === "table" ? (
                <>
                  <div className="border border-border rounded-lg overflow-hidden bg-background">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="font-bold text-base h-14">Title</TableHead>
                            <TableHead className="font-bold text-base h-14">Price</TableHead>
                            <TableHead className="font-bold text-base h-14">Status</TableHead>
                            <TableHead className="font-bold text-base h-14">Date Listed</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredArtworks.map((artwork) => (
                            <TableRow 
                              key={artwork.id}
                              className="cursor-pointer hover:bg-muted/50 transition-colors h-16"
                              onClick={() => handleCardClick(artwork)}
                            >
                              <TableCell className="font-medium text-base">{artwork.title}</TableCell>
                              <TableCell className="text-base">
                                {artwork.price 
                                  ? `${CURRENCIES.find(c => c.code === currencyCode)?.symbol}${artwork.price.toLocaleString()}` 
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
                                {artwork.status === "Available" && (
                                  <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">
                                    <span className="mr-1.5">●</span> Available
                                  </Badge>
                                )}
                                {artwork.status === "Sold" && (
                                  <Badge variant="destructive">
                                    <span className="mr-1.5">●</span> Sold
                                  </Badge>
                                )}
                                {artwork.status === "On Loan" && (
                                  <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">
                                    <span className="mr-1.5">●</span> On Loan {artwork.location && `at ${artwork.location}`}
                                  </Badge>
                                )}
                                {artwork.status === "Reserved" && (
                                  <Badge variant="secondary">
                                    <span className="mr-1.5">●</span> Reserved
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-base text-muted-foreground">
                                {artwork.created_at ? format(new Date(artwork.created_at), "dd MMM yyyy") : "N/A"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  
                  {/* Export Button - Below the table */}
                  <div className="flex justify-end mt-4">
                    <Popover open={exportPopoverOpen} onOpenChange={setExportPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="secondary"
                          size="lg"
                          className="h-12 text-base font-semibold px-6"
                        >
                          <Download className="mr-2 h-5 w-5" />
                          Export
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-0 bg-background" align="end">
                        <div className="flex flex-col">
                          <Button 
                            variant="ghost" 
                            className="justify-start text-base py-3 px-4 rounded-none"
                            onClick={() => handleExport('pdf')}
                          >
                            Export as PDF
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="justify-start text-base py-3 px-4 rounded-none"
                            onClick={() => handleExport('docx')}
                          >
                            Export as DOCX
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArtworks.map((artwork) => (
                    <ArtworkCard
                      key={artwork.id}
                      artwork={artwork}
                      onClick={() => handleCardClick(artwork)}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-16 border border-border rounded-lg bg-muted/20">
                <p className="text-lg text-muted-foreground mb-4">
                  {viewMode === "table" && statusFilter !== "all" 
                    ? `No ${statusFilter.toLowerCase()} artworks found` 
                    : "No artworks yet"}
                </p>
                {(!artworks || artworks.length === 0) && (
                  <Button onClick={() => setAddDrawerOpen(true)} size="lg">
                    Add Your First Artwork
                  </Button>
                )}
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

      {/* Floating Action Button - Only visible in Gallery View */}
      {viewMode === "gallery" && (
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          onClick={() => setAddDrawerOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      <AddArtworkDrawer
        open={addDrawerOpen}
        onOpenChange={setAddDrawerOpen}
        onSuccess={refetch}
      />

      <InvoiceDrawer 
        open={invoiceDrawerOpen} 
        onOpenChange={setInvoiceDrawerOpen} 
      />

      <TransactionWizard
        open={transactionWizardOpen}
        onOpenChange={setTransactionWizardOpen}
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

      {/* Claim Handle Modal - Show if no handle */}
      <ClaimHandleModal
        open={showClaimModal}
        onSuccess={handleClaimSuccess}
      />
    </div>
    </TooltipProvider>
  );
};

export default Index;
