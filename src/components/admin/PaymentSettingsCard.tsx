import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ExternalLink, CreditCard, Shield, Loader2 } from "lucide-react";

const PAYMENT_PLATFORMS = [
  { value: "paypal", label: "PayPal" },
  { value: "gcash", label: "GCash" },
  { value: "paymongo", label: "PayMongo" },
  { value: "bank_transfer", label: "Bank Transfer Instructions" },
  { value: "stripe_link", label: "Stripe Payment Link" },
];

export const PaymentSettingsCard = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paymentPlatform, setPaymentPlatform] = useState<string>("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [urlError, setUrlError] = useState("");

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("artist_settings")
        .select("payment_platform, payment_url, payment_instructions")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPaymentPlatform(data.payment_platform || "");
        setPaymentUrl(data.payment_url || "");
        setPaymentInstructions(data.payment_instructions || "");
      }
    } catch (error: any) {
      console.error("Error fetching payment settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Empty is valid (optional)
    if (paymentPlatform === "bank_transfer") return true; // Bank transfer doesn't need URL validation
    
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleUrlChange = (value: string) => {
    setPaymentUrl(value);
    if (value && !validateUrl(value) && paymentPlatform !== "bank_transfer") {
      setUrlError("Please enter a valid URL");
    } else {
      setUrlError("");
    }
  };

  const handleSave = async () => {
    if (paymentUrl && !validateUrl(paymentUrl)) {
      toast.error("Please enter a valid URL");
      return;
    }

    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("artist_settings")
        .select("id")
        .maybeSingle();

      if (!existing) {
        throw new Error("Settings not found");
      }

      const { error } = await supabase
        .from("artist_settings")
        .update({
          payment_platform: paymentPlatform || null,
          payment_url: paymentUrl || null,
          payment_instructions: paymentInstructions || null,
        })
        .eq("id", existing.id);

      if (error) throw error;

      toast.success("Payment settings saved successfully");
    } catch (error: any) {
      console.error("Error saving payment settings:", error);
      toast.error(error.message || "Failed to save payment settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestLink = () => {
    if (!paymentUrl) {
      toast.error("Please enter a payment link first");
      return;
    }
    if (!validateUrl(paymentUrl)) {
      toast.error("Please enter a valid URL");
      return;
    }
    window.open(paymentUrl, "_blank", "noopener,noreferrer");
  };

  const getPlaceholder = () => {
    switch (paymentPlatform) {
      case "paypal":
        return "https://paypal.me/yourname";
      case "gcash":
        return "Your GCash number or QR code link";
      case "paymongo":
        return "https://paymongo.page/l/...";
      case "stripe_link":
        return "https://buy.stripe.com/...";
      case "bank_transfer":
        return "Enter your bank account details here";
      default:
        return "Enter your payment link or details";
    }
  };

  const getFieldLabel = () => {
    return paymentPlatform === "bank_transfer" ? "Bank Account Details" : "Your Payment Link";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <CardTitle>Payment Integration</CardTitle>
        </div>
        <CardDescription className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-green-500" />
          Connect your personal payment accounts. You receive 100% of the sale directly. Hya&co does not touch your funds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Platform Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="payment-platform">Payment Platform</Label>
          <Select value={paymentPlatform} onValueChange={setPaymentPlatform}>
            <SelectTrigger id="payment-platform" className="bg-background">
              <SelectValue placeholder="Select your payment platform" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {PAYMENT_PLATFORMS.map((platform) => (
                <SelectItem key={platform.value} value={platform.value}>
                  {platform.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment URL / Details */}
        <div className="space-y-2">
          <Label htmlFor="payment-url">{getFieldLabel()}</Label>
          {paymentPlatform === "bank_transfer" ? (
            <Textarea
              id="payment-url"
              value={paymentUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder={getPlaceholder()}
              rows={4}
              className="resize-none"
            />
          ) : (
            <Input
              id="payment-url"
              type="url"
              value={paymentUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder={getPlaceholder()}
              className={urlError ? "border-destructive" : ""}
            />
          )}
          {urlError && (
            <p className="text-sm text-destructive">{urlError}</p>
          )}
        </div>

        {/* Instructions for Collector */}
        <div className="space-y-2">
          <Label htmlFor="payment-instructions">Instructions for Collector (Optional)</Label>
          <Textarea
            id="payment-instructions"
            value={paymentInstructions}
            onChange={(e) => setPaymentInstructions(e.target.value)}
            placeholder="Please include the artwork title in the payment reference note."
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            This message will be shown to collectors when they proceed to payment.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleTestLink}
            disabled={!paymentUrl || !!urlError || paymentPlatform === "bank_transfer"}
            className="flex-1"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Test Link
          </Button>
        </div>

        {/* Live Preview */}
        {paymentUrl && paymentPlatform && (
          <div className="pt-4 border-t">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Live Preview
            </Label>
            <div className="mt-3 p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm text-muted-foreground mb-3">
                This is how the buy button will appear on your public profile:
              </p>
              <Button
                onClick={handleTestLink}
                disabled={paymentPlatform === "bank_transfer"}
                className="w-full sm:w-auto"
              >
                Buy Now
              </Button>
              {paymentInstructions && (
                <p className="mt-3 text-sm text-muted-foreground italic">
                  "{paymentInstructions}"
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
