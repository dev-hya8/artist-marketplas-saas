import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

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

  useEffect(() => {
    const savedCurrency = localStorage.getItem("selectedCurrency");
    
    if (savedCurrency) {
      setCurrencyCode(savedCurrency);
    } else {
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
          console.log(`CurrencyContext: Exchange rate for ${currencyCode} is ${data.conversion_rates[currencyCode]}`);
        } else {
          throw new Error("Rate not found in response");
        }
      } catch (error) {
        console.log(`CurrencyContext: API failed, using fallback rate for ${currencyCode}`);
        setExchangeRate(FALLBACK_RATES[currencyCode] || 1);
        setIsRateFailed(true);
      }
    };

    fetchExchangeRates();
  }, [currencyCode]);

  const setCurrency = (currency: string) => {
    console.log(`CurrencyContext: Setting currency to ${currency}`);
    setCurrencyCode(currency);
    localStorage.setItem("selectedCurrency", currency);
  };

  const convertPrice = useCallback((price: number, fromCurrency: string = "USD"): string => {
    const fromCurrencyInfo = CURRENCIES.find(c => c.code === fromCurrency);
    const fromSymbol = fromCurrencyInfo?.symbol || "$";
    
    if (isRateFailed && fromCurrency !== currencyCode) {
      return `${fromSymbol}${Math.round(price).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${fromCurrency}`;
    }
    
    const toCurrencyI
