import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Trash2, X, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CartDrawer = ({ open, onOpenChange }: CartDrawerProps) => {
  const { items, removeFromCart, clearCart, cartTotal, itemCount } = useCart();
  const { convertPrice, currencyCode, currencySymbol } = useCurrency();
  const { toast } = useToast();

  const handleRemove = (artworkId: string, title: string) => {
    removeFromCart(artworkId);
    toast({
      title: "Removed from cart",
      description: `"${title}" has been removed from your collection.`,
    });
  };

  const handleClearAll = () => {
    clearCart();
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart.",
    });
  };

  const handleCheckout = () => {
    toast({
      title: "Checkout coming soon",
      description: "The checkout flow is currently under development.",
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="relative border-b">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 h-8 w-8"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5" />
            <div>
              <DrawerTitle>Your Collection</DrawerTitle>
              <DrawerDescription>
                {itemCount === 0 ? "Your cart is empty" : `${itemCount} ${itemCount === 1 ? "item" : "items"} in your cart`}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 max-h-[60vh]">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground text-lg">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-2">
                Browse artworks and add them to your collection
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const price = item.artwork.sale_type === "auction" 
                  ? item.artwork.current_bid 
                  : item.artwork.price;
                
                return (
                  <div
                    key={item.artwork.id}
                    className="flex gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      {item.artwork.image_url ? (
                        <img
                          src={item.artwork.image_url}
                          alt={item.artwork.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No image
                        </div>
                      )}
                      {item.artwork.sale_type === "auction" && (
                        <Badge 
                          variant="secondary" 
                          className="absolute bottom-1 left-1 text-[8px] px-1 py-0"
                        >
                          Auction
                        </Badge>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                        {item.artwork.title}
                      </h3>
                      {item.artwork.dimensions && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {item.artwork.dimensions}
                        </p>
                      )}
                      {price && (
                        <p className="font-bold text-base">
                          {convertPrice(Number(price), item.artwork.base_currency || "USD")}
                        </p>
                      )}
                    </div>

                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(item.artwork.id, item.artwork.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DrawerFooter className="border-t">
          {items.length > 0 && (
            <>
              {/* Subtotal */}
              <div className="flex justify-between items-center text-lg font-bold mb-2">
                <span>Subtotal:</span>
                <span>
                  {currencySymbol}
                  {cartTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* Action Buttons */}
              <Button 
                onClick={handleCheckout} 
                size="lg" 
                className="w-full"
              >
                Proceed to Checkout
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClearAll}
                  className="flex-1"
                >
                  Clear All
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" className="flex-1">
                    Continue Shopping
                  </Button>
                </DrawerClose>
              </div>
            </>
          )}

          {items.length === 0 && (
            <DrawerClose asChild>
              <Button variant="default" size="lg" className="w-full">
                Browse Artworks
              </Button>
            </DrawerClose>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
