import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface CurrencyContextType {
  selectedCountry: string;
  currencyCode: string;
  convertPrice: (usdPrice: number) => Promise<string>;
  setCountry: (country: string) => void;
}

const COUNTRIES = [
  { code: "US", name: "United States", currency: "USD" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "EU", name: "Eurozone", currency: "EUR" },
  { code: "JP", name: "Japan", currency: "JPY" },
  { code: "CA", name: "Canada", currency: "CAD" },
  { code: "AU", name: "Australia", currency: "AUD" },
  { code: "PH", name: "Philippines", currency: "PHP" },
];

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [currencyCode, setCurrencyCode] = useState<string>("USD");
  const [showDialog, setShowDialog] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  useEffect(() => {
    const savedCountry = localStorage.getItem("selectedCountry");
    if (savedCountry) {
      setSelectedCountry(savedCountry);
      const country = COUNTRIES.find((c) => c.code === savedCountry);
      if (country) {
        setCurrencyCode(country.currency);
      }
    } else {
      setShowDialog(true);
    }
  }, []);

  useEffect(() => {
    if (currencyCode && currencyCode !== "USD") {
      fetchExchangeRates();
    }
  }, [currencyCode]);

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch(`https://api.frankfurter.app/latest?from=USD&to=${currencyCode}`);
      const data = await response.json();
      setExchangeRates(data.rates);
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
    }
  };

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountry(countryCode);
    localStorage.setItem("selectedCountry", countryCode);
    const country = COUNTRIES.find((c) => c.code === countryCode);
    if (country) {
      setCurrencyCode(country.currency);
    }
    setShowDialog(false);
  };

  const convertPrice = async (usdPrice: number): Promise<string> => {
    if (currencyCode === "USD") {
      return `$${usdPrice.toLocaleString()}`;
    }

    const rate = exchangeRates[currencyCode];
    if (rate) {
      const converted = usdPrice * rate;
      const symbol = currencyCode === "EUR" ? "€" : currencyCode === "GBP" ? "£" : currencyCode === "JPY" ? "¥" : currencyCode;
      return `${symbol}${converted.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }

    return `$${usdPrice.toLocaleString()}`;
  };

  const setCountry = (countryCode: string) => {
    handleCountrySelect(countryCode);
  };

  return (
    <CurrencyContext.Provider value={{ selectedCountry, currencyCode, convertPrice, setCountry }}>
      {children}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Where are you visiting from?</DialogTitle>
            <DialogDescription>
              Select your country to see prices in your local currency
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select onValueChange={handleCountrySelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name} ({country.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
};
