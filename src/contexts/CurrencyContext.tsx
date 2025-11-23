import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface CurrencyContextType {
  currencyCode: string;
  currencySymbol: string;
  convertPrice: (price: number, fromCurrency?: string) => string;
  setCurrency: (currency: string) => void;
  exchangeRate: number;
  isRateFailed: boolean;
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
  const [isRateFailed, setIsRateFailed] = useState<boolean>(false);

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
        } else {
          throw new Error("Rate not found in response");
        }
      } catch (error) {
        setExchangeRate(FALLBACK_RATES[currencyCode] || 1);
        setIsRateFailed(true);
      }
    };

    fetchExchangeRates();
  }, [currencyCode]);

  const setCurrency = (currency: string) => {
    setCurrencyCode(currency);
    localStorage.setItem("selectedCurrency", currency);
  };

  const convertPrice = (price: number, fromCurrency: string = "USD"): string => {
    const fromCurrencyInfo = CURRENCIES.find(c => c.code === fromCurrency);
    const fromSymbol = fromCurrencyInfo?.symbol || "$";
    
    // If API failed, just return the native price
    if (isRateFailed && fromCurrency !== currencyCode) {
      return `${fromSymbol}${Math.round(price).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${fromCurrency}`;
    }
    
    const toCurrencyInfo = CURRENCIES.find(c => c.code === currencyCode);
    const toSymbol = toCurrencyInfo?.symbol || "$";
    
    // If converting to the same currency, just format it
    if (currencyCode === fromCurrency) {
      return `${toSymbol}${Math.round(price).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }

    // Convert from any currency to USD first, then to target currency
    let priceInUSD = price;
    
    if (fromCurrency !== "USD") {
      const fromRate = FALLBACK_RATES[fromCurrency] || 1;
      priceInUSD = price / fromRate;
    }
    
    // Now convert from USD to target currency
    if (currencyCode === "USD") {
      const finalValue = Math.round(priceInUSD);
      return `${toSymbol}${finalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }

    const converted = Math.round(priceInUSD * exchangeRate);
    return `${toSymbol}${converted.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const currencySymbol = CURRENCIES.find(c => c.code === currencyCode)?.symbol || "$";

  return (
    <CurrencyContext.Provider value={{ currencyCode, currencySymbol, convertPrice, setCurrency, exchangeRate, isRateFailed }}>
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
