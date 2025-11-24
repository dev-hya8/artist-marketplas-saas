import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Instagram, Facebook, Twitter } from "lucide-react";
import { useArtistSettings } from "@/contexts/ArtistSettingsContext";
import { FaTiktok } from "react-icons/fa";

const INQUIRY_TYPES = [
  "Commission",
  "Purchase Inquiry",
  "Collaboration",
  "Other",
] as const;

export const ContactInfoCard = () => {
  const { settings } = useArtistSettings();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    inquiryType: "Other" as typeof INQUIRY_TYPES[number],
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("inquiries")
        .insert({
          name: formData.name,
          email: formData.email,
          inquiry_type: formData.inquiryType,
          message: formData.message,
          artwork_id: null,
        });

      if (error) throw error;

      toast.success("Your inquiry has been sent successfully!");
      setFormData({ name: "", email: "", inquiryType: "Other", message: "" });
    } catch (error: any) {
      console.error("Error submitting inquiry:", error);
      toast.error(error.message || "Failed to send inquiry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="space-y-3 pb-8">
        <h2 className="text-2xl font-light tracking-wide">Connect & Inquire</h2>
        <p className="text-sm text-muted-foreground font-light leading-relaxed">
          Interested in commissions, collaborations, or purchasing artwork? Send a detailed inquiry below.
        </p>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Primary Action - Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-light">
              Full Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-light">
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inquiryType" className="text-sm font-light">
              Inquiry Type *
            </Label>
            <Select
              value={formData.inquiryType}
              onValueChange={(value) =>
                setFormData({ ...formData, inquiryType: value as typeof INQUIRY_TYPES[number] })
              }
            >
              <SelectTrigger id="inquiryType" className="h-11">
                <SelectValue placeholder="Select inquiry type" />
              </SelectTrigger>
              <SelectContent>
                {INQUIRY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-light">
              Message/Project Details *
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={6}
              required
              className="resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 font-normal tracking-wide"
          >
            {loading ? "Sending..." : "Send Inquiry"}
          </Button>
        </form>

        {/* Secondary Info - Professional Contact & Response Time */}
        <div className="pt-6 border-t border-border/50 space-y-4">
          {settings?.contact_email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-light uppercase tracking-wider mb-1">
                  Professional Email
                </p>
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="text-sm text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                >
                  {settings.contact_email}
                </a>
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground font-light leading-relaxed">
            We typically respond to all formal inquiries within 48 hours.
          </div>
        </div>

        {/* Social Links */}
        {(settings?.instagram_handle ||
          settings?.facebook_handle ||
          settings?.twitter_handle ||
          settings?.tiktok_handle) && (
          <div className="pt-6 border-t border-border/50">
            <div className="flex items-center gap-5">
              {settings.instagram_handle && (
                <a
                  href={`https://instagram.com/${settings.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {settings.facebook_handle && (
                <a
                  href={`https://facebook.com/${settings.facebook_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings.twitter_handle && (
                <a
                  href={`https://twitter.com/${settings.twitter_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Twitter/X"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {settings.tiktok_handle && (
                <a
                  href={`https://tiktok.com/@${settings.tiktok_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="TikTok"
                >
                  <FaTiktok className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
