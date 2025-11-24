import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Database } from "@/integrations/supabase/types";

type Artwork = Database["public"]["Tables"]["artworks"]["Row"];

interface CartItem {
  artwork: Artwork;
  addedAt: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (artwork: Artwork) => void;
  removeFromCart: (artworkId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
  isInCart: (artworkId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "artist_cart_items";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setItems(parsed);
        console.log("🛒 Cart loaded from localStorage:", parsed.length, "items");
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      console.log("💾 Cart saved to localStorage:", items.length, "items");
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
    }
  }, [items]);

  const addToCart = (artwork: Artwork) => {
    setItems((prev) => {
      // Check if already in cart
      if (prev.some((item) => item.artwork.id === artwork.id)) {
        console.log("⚠️ Item already in cart:", artwork.title);
        return prev;
      }

      const newItem: CartItem = {
        artwork,
        addedAt: new Date().toISOString(),
      };

      console.log("✅ Added to cart:", artwork.title);
      return [...prev, newItem];
    });
  };

  const removeFromCart = (artworkId: string) => {
    setItems((prev) => {
      const filtered = prev.filter((item) => item.artwork.id !== artworkId);
      console.log("🗑️ Removed from cart:", artworkId);
      return filtered;
    });
  };

  const clearCart = () => {
    setItems([]);
    console.log("🧹 Cart cleared");
  };

  const isInCart = (artworkId: string) => {
    return items.some((item) => item.artwork.id === artworkId);
  };

  const cartTotal = items.reduce((sum, item) => {
    const price = item.artwork.sale_type === "auction" 
      ? item.artwork.current_bid 
      : item.artwork.price;
    return sum + (price || 0);
  }, 0);

  const itemCount = items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        clearCart,
        cartTotal,
        itemCount,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
