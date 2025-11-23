import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";

interface CurrencyContextType {
  currencyCode: string;
  currencySymbol: string;
  convertPrice: (price: number, fromCurrency?: string) => string;
  setCurrency: (currency: string) => void;
  exchangeRate: number;
}

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
];

const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  PHP: 58,
  EUR: 0.92,
  GBP: 0.79,
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currencyCode, setCurrencyCode] = useState<string>("USD");
  const [exchangeRate, setExchangeRate] = useState<number>(1);

  // Auto-detect locale and load saved preference
  useEffect(() => {
    const savedCurrency = localStorage.getItem("selectedCurrency");
    
    if (savedCurrency) {
      setCurrencyCode(savedCurrency);
    } else {
      // Auto-detect: Check if user is in Philippines
      try {
        const locale = navigator.language || 'en-US';
        if (locale.toLowerCase().includes('ph') || locale.toLowerCase().includes('fil')) {
          setCurrencyCode('PHP');
        }
      } catch (error) {
        console.log('Could not detect locale, defaulting to USD');
      }
    }
  }, []);

  // Fetch exchange rates when currency changes
  useEffect(() => {
    if (currencyCode === "USD") {
      setExchangeRate(1);
      return;
    }

    const fetchExchangeRates = async () => {
      try {
        const response = await fetch(`https://api.frankfurter.app/latest?from=USD&to=${currencyCode}`);
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.rates && data.rates[currencyCode]) {
          setExchangeRate(data.rates[currencyCode]);
        } else {
          throw new Error("Rate not found in response");
        }
      } catch (error) {
        console.error("Error fetching exchange rates:", error);
        setExchangeRate(FALLBACK_RATES[currencyCode] || 1);
        
        toast({
          title: "Currency Conversion Warning",
          description: "Error fetching live currency rates. Displaying fallback value.",
          variant: "destructive",
        });
      }
    };

    fetchExchangeRates();
  }, [currencyCode]);

  const setCurrency = (currency: string) => {
    setCurrencyCode(currency);
    localStorage.setItem("selectedCurrency", currency);
  };

  const convertPrice = (price: number, fromCurrency: string = "USD"): string => {
    const toCurrencyInfo = CURRENCIES.find(c => c.code === currencyCode);
    const symbol = toCurrencyInfo?.symbol || "$";
    
    // If converting to the same currency, just format it
    if (currencyCode === fromCurrency) {
      return `${symbol}${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }

    // Convert from any currency to USD first, then to target currency
    let priceInUSD = price;
    
    if (fromCurrency !== "USD") {
      // Convert FROM the base currency TO USD
      const fromRate = FALLBACK_RATES[fromCurrency] || 1;
      priceInUSD = price / fromRate;
      
      console.log("=== CURRENCY CONVERSION DEBUG ===");
      console.log(`RATE USED (${fromCurrency} to USD):`, fromRate);
      console.log(`BASE CURRENCY:`, fromCurrency);
      console.log(`PRICE IN USD:`, priceInUSD);
    }
    
    // Now convert from USD to target currency
    if (currencyCode === "USD") {
      const finalValue = priceInUSD;
      console.log(`FINAL CONVERTED VALUE (${currencyCode}):`, finalValue);
      return `${symbol}${finalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }

    const converted = priceInUSD * exchangeRate;
    console.log(`RATE USED (USD to ${currencyCode}):`, exchangeRate);
    console.log(`FINAL CONVERTED VALUE (${currencyCode}):`, converted);
    
    return `${symbol}${converted.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const currencySymbol = CURRENCIES.find(c => c.code === currencyCode)?.symbol || "$";

  return (
    <CurrencyContext.Provider value={{ currencyCode, currencySymbol, convertPrice, setCurrency, exchangeRate }}>
      {children}
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

export { CURRENCIES };
