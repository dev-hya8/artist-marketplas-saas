import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CurrencyContextType {
  currencyCode: string;
  currencySymbol: string;
  convertPrice: (price: number, fromCurrency?: string) => string;
  setCurrency: (currency: string) => void;
  exchangeRate: number;
  isRateFailed: boolean;
  refetchCurrency: () => Promise<void>;
}

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar", region: "US" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso", region: "PH" },
  { code: "EUR", symbol: "€", name: "Euro", region: "EU" },
  { code: "GBP", symbol: "£", name: "British Pound", region: "GB" },
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
  const [isRateFailed, setIsRateFailed] = useState<boolean>(false);

  const fetchCurrencyFromSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("artist_settings")
        .select("currency_region")
        .maybeSingle();

      if (error) throw error;
      
      if (data && data.currency_region) {
        const currency = CURRENCIES.find(c => c.region === data.currency_region);
        if (currency) {
          setCurrencyCode(currency.code);
          return;
        }
      }
    } catch (error) {
      console.error("Error fetching currency from settings:", error);
    }
    
    // Fallback to USD if no setting found
    setCurrencyCode("USD");
  };

  useEffect(() => {
    fetchCurrencyFromSettings();
  }, []);

  useEffect(() => {
    console.log(`CurrencyContext: Currency changed to ${currencyCode}`);
    
    if (currencyCode === "USD") {
      setExchangeRate(1);
      setIsRateFailed(false);
      return;
    }

    const fetchExchangeRates = async () => {
      try {
        const apiKey = import.meta.env.VITE_EXCHANGE_RATE_KEY;
        
        if (!apiKey) {
          throw new Error("API key not configured");
        }
        
        const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.result === "success" && data.conversion_rates && data.conversion_rates[currencyCode]) {
          setExchangeRate(data.conversion_rates[currencyCode]);
          setIsRateFailed(false);
          console.log(`✅ CurrencyContext: Updated rate for ${currencyCode} = ${data.conversion_rates[currencyCode]}`);
        } else {
          throw new Error("Rate not found in response");
        }
      } catch (error) {
        console.log(`CurrencyContext: API failed, using fallback rate for ${currencyCode}`);
        setExchangeRate(FALLBACK_RATES[currencyCode] || 1);
        setIsRateFailed(true);
      }
    };

    // 🔥 Fetch immediately
    fetchExchangeRates();
    
    // 🔥 Then refresh every 1 hour (3,600,000 milliseconds)
    const interval = setInterval(fetchExchangeRates, 3600000);
    
    // 🔥 Cleanup when currency changes or component unmounts
    return () => clearInterval(interval);
  }, [currencyCode]);

  const setCurrency = (currency: string) => {
    console.log(`CurrencyContext: Setting currency to ${currency}`);
    setCurrencyCode(currency);
    // Currency is now managed in database, not localStorage
  };

  const convertPrice = useCallback((price: number, fromCurrency: string = "USD"): string => {
    const fromCurrencyInfo = CURRENCIES.find(c => c.code === fromCurrency);
    const fromSymbol = fromCurrencyInfo?.symbol || "$";
    
    // Allow fallback conversion even when API fails
    if (isRateFailed) {
      console.log(`⚠️ Using fallback rates for ${currencyCode}`);
    }
    
    const toCurrencyInfo = CURRENCIES.find(c => c.code === currencyCode);
    const toSymbol = toCurrencyInfo?.symbol || "$";
    
    if (currencyCode === fromCurrency) {
      return `${toSymbol}${Math.round(price).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }

    let priceInUSD = price;
    
    if (fromCurrency !== "USD") {
      const fromRate = FALLBACK_RATES[fromCurrency] || 1;
      priceInUSD = price / fromRate;
    }
    
    if (currencyCode === "USD") {
      const finalValue = Math.round(priceInUSD);
      return `${toSymbol}${finalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }

    const converted = Math.round(priceInUSD * exchangeRate);
    return `${toSymbol}${converted.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }, [currencyCode, exchangeRate, isRateFailed]);

  const currencySymbol = CURRENCIES.find(c => c.code === currencyCode)?.symbol || "$";

  return (
    <CurrencyContext.Provider value={{ 
      currencyCode, 
      currencySymbol, 
      convertPrice, 
      setCurrency, 
      exchangeRate, 
      isRateFailed,
      refetchCurrency: fetchCurrencyFromSettings 
    }}>
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
