import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface CurrencyContextType {
  currencyCode: string;
  currencySymbol: string;
  convertPrice: (usdPrice: number) => string;
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
        const data = await response.json();
        
        if (data.rates && data.rates[currencyCode]) {
          setExchangeRate(data.rates[currencyCode]);
        } else {
          // Use fallback rate if API fails
          setExchangeRate(FALLBACK_RATES[currencyCode] || 1);
        }
      } catch (error) {
        console.error("Error fetching exchange rates, using fallback:", error);
        setExchangeRate(FALLBACK_RATES[currencyCode] || 1);
      }
    };

    fetchExchangeRates();
  }, [currencyCode]);

  const setCurrency = (currency: string) => {
    setCurrencyCode(currency);
    localStorage.setItem("selectedCurrency", currency);
  };

  const convertPrice = (usdPrice: number): string => {
    const currencyInfo = CURRENCIES.find(c => c.code === currencyCode);
    const symbol = currencyInfo?.symbol || "$";
    
    if (currencyCode === "USD") {
      return `${symbol}${usdPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }

    const converted = usdPrice * exchangeRate;
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
