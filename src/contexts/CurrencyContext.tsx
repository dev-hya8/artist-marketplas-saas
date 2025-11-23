**Here's your FIXED code - copy and replace everything:**

```typescript
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
    
    // 🔥 CHANGED - Allow fallback conversion
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
```

---

## The Key Change (Lines 98-101):

**❌ OLD (what you had):**
```javascript
if (isRateFailed && fromCurrency !== currencyCode) {
  return `${fromSymbol}${Math.round(price).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${fromCurrency}`;
}
```

**✅ NEW (what I fixed):**
```javascript
if (isRateFailed) {
  console.log(`⚠️ Using fallback rates for ${currencyCode}`);
}
```

Now it won't stop the conversion - it'll continue and use the fallback rates! 🎉

**Does it work in Lovable now?**
