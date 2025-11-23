import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCurrency, CURRENCIES } from "@/contexts/CurrencyContext";
import type { Database } from "@/integrations/supabase/types";

type ArtworkStatus = Database["public"]["Enums"]["artwork_status"];

interface AddArtworkDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddArtworkDrawer = ({
  open,
  onOpenChange,
  onSuccess,
}: AddArtworkDrawerProps) => {
  const { toast } = useToast();
  const { convertPrice, currencyCode, exchangeRate, isRateFailed } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    price: "",
    base_currency: "USD",
    status: "Available" as ArtworkStatus,
    dimensions: "",
    depth: "",
    medium: "",
    location: "",
    sale_type: "fixed" as "fixed" | "auction",
    auction_end_time: "",
    starting_bid: "",
    min_bid_increment: "100",
  });
  const [errors, setErrors] = useState({
    image_url: false,
    price: false,
    dimensions: false,
    medium: false,
    location: false,
    auction_end_time: false,
    starting_bid: false,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      e.target.value = ""; // Reset file input
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('artwork_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('artwork_images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form values on submit:', formData);
    
    if (uploading) {
      toast({
        title: "Please wait",
        description: "Image is still uploading",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    const newErrors = {
      image_url: !formData.image_url,
      price: formData.sale_type === "fixed" ? !formData.price : false,
      dimensions: !formData.dimensions,
      medium: !formData.medium,
      location: !formData.location,
      auction_end_time: formData.sale_type === "auction" ? !formData.auction_end_time : false,
      starting_bid: formData.sale_type === "auction" ? !formData.starting_bid : false,
    };

    setErrors(newErrors);

    // Check if any errors exist
    if (Object.values(newErrors).some(error => error)) {
      const errorMessages = [];
      if (newErrors.image_url) errorMessages.push("Image is required");
      if (newErrors.price) errorMessages.push("Price is required for Fixed Price items");
      if (newErrors.dimensions) errorMessages.push("Dimensions are required");
      if (newErrors.medium) errorMessages.push("Medium is required");
      if (newErrors.location) errorMessages.push("Location is required");
      if (newErrors.auction_end_time) errorMessages.push("Auction End Time is required for auctions");
      if (newErrors.starting_bid) errorMessages.push("Starting Bid is required for auctions");
      
      const errorMessage = errorMessages.join("\n");
      window.alert("Validation Failed:\n\n" + errorMessage);
      
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields before submitting",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Convert datetime-local to ISO string for database
      let auctionEndTimeISO = null;
      if (formData.sale_type === "auction" && formData.auction_end_time) {
        try {
          // datetime-local format: "2024-03-15T14:30"
          console.log('Converting auction_end_time:', formData.auction_end_time);
          // Convert to ISO string for database
          auctionEndTimeISO = new Date(formData.auction_end_time).toISOString();
          console.log('Converted to ISO:', auctionEndTimeISO);
        } catch (dateError) {
          console.error('Date conversion error:', dateError);
          window.alert("Invalid auction end time format: " + dateError);
          throw new Error("Invalid auction end time format");
        }
      }

      console.log('About to insert artwork with data:', {
        title: formData.title,
        sale_type: formData.sale_type,
        auction_end_time: auctionEndTimeISO,
        current_bid: formData.sale_type === "auction" && formData.starting_bid ? parseFloat(formData.starting_bid) : null,
      });

      const { error } = await supabase.from("artworks").insert({
        title: formData.title,
        image_url: formData.image_url || null,
        price: formData.sale_type === "fixed" && formData.price ? parseFloat(formData.price) : null,
        base_currency: formData.base_currency,
        status: formData.status,
        dimensions: formData.dimensions || null,
        depth: formData.depth ? parseFloat(formData.depth) : null,
        medium: formData.medium || null,
        location: formData.location || null,
        sale_type: formData.sale_type,
        auction_end_time: auctionEndTimeISO,
        current_bid: formData.sale_type === "auction" && formData.starting_bid ? parseFloat(formData.starting_bid) : null,
        min_bid_increment: formData.sale_type === "auction" && formData.min_bid_increment ? parseFloat(formData.min_bid_increment) : 100,
      });

      if (error) {
        console.error('Supabase insert error:', error);
        window.alert("Database Error:\n\n" + JSON.stringify(error, null, 2));
        throw error;
      }

      toast({
        title: "Success",
        description: "Artwork added successfully",
      });
      
      setFormData({
        title: "",
        image_url: "",
        price: "",
        base_currency: "USD",
        status: "Available",
        dimensions: "",
        depth: "",
        medium: "",
        location: "",
        sale_type: "fixed",
        auction_end_time: "",
        starting_bid: "",
        min_bid_increment: "100",
      });
      setImagePreview(null);
      setErrors({
        image_url: false,
        price: false,
        dimensions: false,
        medium: false,
        location: false,
        auction_end_time: false,
        starting_bid: false,
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Artwork submission error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add artwork",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add New Artwork</DrawerTitle>
          <DrawerDescription>Fill in the details for your new artwork</DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="px-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Artwork Image *</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className={errors.image_url ? "border-destructive" : ""}
            />
            {uploading && <p className="text-sm text-muted-foreground">Uploading image...</p>}
            {errors.image_url && !uploading && (
              <p className="text-sm text-destructive">Image is required</p>
            )}
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-md border"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sale_type">Sale Type</Label>
            <Select
              value={formData.sale_type}
              onValueChange={(value: "fixed" | "auction") => setFormData({ ...formData, sale_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed Price</SelectItem>
                <SelectItem value="auction">Auction</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.sale_type === "fixed" ? (
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <div className="flex gap-2">
                <Input
                  id="price"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only numbers and decimal point
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setFormData({ ...formData, price: value });
                      setErrors({ ...errors, price: false });
                    }
                  }}
                  className={`flex-1 ${errors.price ? "border-destructive" : ""}`}
                  style={{
                    appearance: 'textfield',
                    MozAppearance: 'textfield',
                    WebkitAppearance: 'none'
                  }}
                />
                <Select
                  value={formData.base_currency}
                  onValueChange={(value) => setFormData({ ...formData, base_currency: value })}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.price && parseFloat(formData.price) > 0 && !isRateFailed && currencyCode !== formData.base_currency && (
                <p className="text-xs text-muted-foreground">
                  ≈ {convertPrice(parseFloat(formData.price), formData.base_currency)}
                </p>
              )}
              {errors.price && (
                <p className="text-sm text-destructive">Price is required</p>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="starting_bid">Starting Bid (USD) *</Label>
                <Input
                  id="starting_bid"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.starting_bid}
                  onChange={(e) => {
                    setFormData({ ...formData, starting_bid: e.target.value });
                    setErrors({ ...errors, starting_bid: false });
                  }}
                  className={errors.starting_bid ? "border-destructive" : ""}
                />
                {formData.starting_bid && parseFloat(formData.starting_bid) > 0 && currencyCode !== "USD" && (
                  <p className="text-xs text-muted-foreground">
                    ≈ {convertPrice(parseFloat(formData.starting_bid))}
                  </p>
                )}
                {errors.starting_bid && (
                  <p className="text-sm text-destructive">Starting Bid is required</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="auction_end_time">Auction End Time *</Label>
                <input
                  id="auction_end_time"
                  type="datetime-local"
                  value={formData.auction_end_time}
                  onChange={(e) => {
                    const value = e.target.value;
                    console.log('Auction end time changed to:', value);
                    setFormData({ ...formData, auction_end_time: value });
                    setErrors({ ...errors, auction_end_time: false });
                  }}
                  className={`flex h-10 w-full rounded-md border ${errors.auction_end_time ? "border-destructive" : "border-input"} bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                />
                {errors.auction_end_time && (
                  <p className="text-sm text-destructive">Auction end time is required for auctions</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Current value: {formData.auction_end_time || 'Not set'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_bid_increment">Minimum Bid Increment *</Label>
                <Input
                  id="min_bid_increment"
                  type="number"
                  step="0.01"
                  placeholder="100"
                  value={formData.min_bid_increment}
                  onChange={(e) => setFormData({ ...formData, min_bid_increment: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as ArtworkStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Sold">Sold</SelectItem>
                <SelectItem value="On Loan">On Loan</SelectItem>
                <SelectItem value="Reserved">Reserved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dimensions">Dimensions (H x W) *</Label>
            <Input
              id="dimensions"
              placeholder="e.g., 24 x 36"
              value={formData.dimensions}
              onChange={(e) => {
                setFormData({ ...formData, dimensions: e.target.value });
                setErrors({ ...errors, dimensions: false });
              }}
              className={errors.dimensions ? "border-destructive" : ""}
            />
            {errors.dimensions && (
              <p className="text-sm text-destructive">Dimensions are required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="depth">Depth (optional)</Label>
            <Input
              id="depth"
              type="number"
              step="0.01"
              placeholder="e.g., 2"
              value={formData.depth}
              onChange={(e) => setFormData({ ...formData, depth: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">For 3D works/sculptures</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medium">Medium *</Label>
            <Input
              id="medium"
              placeholder="e.g., Oil on canvas"
              value={formData.medium}
              onChange={(e) => {
                setFormData({ ...formData, medium: e.target.value });
                setErrors({ ...errors, medium: false });
              }}
              className={errors.medium ? "border-destructive" : ""}
            />
            {errors.medium && (
              <p className="text-sm text-destructive">Medium is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              placeholder="e.g., Studio, Gallery X"
              value={formData.location}
              onChange={(e) => {
                setFormData({ ...formData, location: e.target.value });
                setErrors({ ...errors, location: false });
              }}
              className={errors.location ? "border-destructive" : ""}
            />
            {errors.location && (
              <p className="text-sm text-destructive">Location is required</p>
            )}
          </div>

          <DrawerFooter className="px-0 pb-4">
            <Button type="submit" disabled={loading || uploading}>
              {loading ? "Adding..." : uploading ? "Uploading..." : "Add Artwork"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" disabled={loading || uploading}>Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};
