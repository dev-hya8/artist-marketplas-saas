import { Link } from "react-router-dom";
import { useArtistSettings } from "@/contexts/ArtistSettingsContext";
import { useCurrency, CURRENCIES } from "@/contexts/CurrencyContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export const Navbar = () => {
  const { settings, loading } = useArtistSettings();
  const { currencyCode, currencySymbol, setCurrency } = useCurrency();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-light tracking-wide hover:opacity-70 transition-opacity">
            {loading ? "Loading..." : settings?.display_name || "Hya Baliña"}
          </Link>
          <div className="flex items-center gap-6">
            <div className="flex gap-8">
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
          </div>
        </div>
      </div>
    </nav>
  );
};
