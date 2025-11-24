import { useState } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { useArtistSettings } from "@/contexts/ArtistSettingsContext";
import { useCurrency, CURRENCIES } from "@/contexts/CurrencyContext";
import { useCart } from "@/contexts/CartContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { CartDrawer } from "@/components/CartDrawer";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Navbar = () => {
  const { settings, loading } = useArtistSettings();
  const { currencyCode, currencySymbol, setCurrency } = useCurrency();
  const { itemCount } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  
  const isHomePage = location.pathname === "/";
  const viewMode = searchParams.get("view") || "buy-now";

  const setViewMode = (mode: string) => {
    setSearchParams({ view: mode });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: View Mode Tabs (only on home page) */}
          {isHomePage && (
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <button
                onClick={() => setViewMode("buy-now")}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                  viewMode === "buy-now"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Buy Now
              </button>
              <button
                onClick={() => setViewMode("auctions")}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                  viewMode === "auctions"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Auctions
              </button>
            </div>
          )}
          
          {/* Center/Right: Navigation Links */}
          <div className="flex items-center gap-6 ml-auto">
            <div className="hidden md:flex gap-8">
              <Link to="/" className="text-sm font-light tracking-wide hover:opacity-70 transition-opacity">
                Works
              </Link>
              <Link to="/about" className="text-sm font-light tracking-wide hover:opacity-70 transition-opacity">
                About
              </Link>
              <Link to="/contact" className="text-sm font-light tracking-wide hover:opacity-70 transition-opacity">
                Contact
              </Link>
            </div>
            
            {/* Far Right: Currency + Theme Toggle + Cart */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 text-sm font-light">
                    {currencyCode} {currencySymbol}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border-border z-[100]">
                  {CURRENCIES.map((currency) => (
                    <DropdownMenuItem
                      key={currency.code}
                      onClick={() => {
                        console.log(`Currency changed to: ${currency.code}`);
                        setCurrency(currency.code);
                      }}
                      className={currencyCode === currency.code ? "bg-accent" : ""}
                    >
                      {currency.code} ({currency.symbol}) - {currency.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <ThemeToggle />

              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => setCartDrawerOpen(true)}
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CartDrawer open={cartDrawerOpen} onOpenChange={setCartDrawerOpen} />
    </nav>
  );
};
