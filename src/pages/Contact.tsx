import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Phone, Instagram, Facebook, Twitter } from "lucide-react";
import { useArtistSettings } from "@/contexts/ArtistSettingsContext";

export default function Contact() {
  const { settings, loading: settingsLoading } = useArtistSettings();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
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
          message: formData.message,
          artwork_id: null,
        });

      if (error) throw error;

      toast.success("Message sent successfully!");
      setFormData({ name: "", email: "", message: "" });
    } catch (error: any) {
      console.error("Error submitting inquiry:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const isPrimaryMethod = (method: string) => {
    return settings?.primary_contact_method === method;
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-light tracking-wide mb-12">Contact</h1>
          
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Get in Touch</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Email */}
                  {settings?.contact_email && (
                    <div className="flex items-start gap-3">
                      <Mail className={`h-5 w-5 mt-0.5 ${isPrimaryMethod('email') ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className={`${isPrimaryMethod('email') ? 'font-semibold text-lg' : 'font-light'}`}>
                          Email
                        </p>
                        <a 
                          href={`mailto:${settings.contact_email}`}
                          className="text-sm text-foreground hover:underline"
                        >
                          {settings.contact_email}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  {settings?.phone_number && (
                    <div className="flex items-start gap-3">
                      <Phone className={`h-5 w-5 mt-0.5 ${isPrimaryMethod('phone') ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className={`${isPrimaryMethod('phone') ? 'font-semibold text-lg' : 'font-light'}`}>
                          Phone
                        </p>
                        <a 
                          href={`tel:${settings.phone_number}`}
                          className="text-sm text-foreground hover:underline"
                        >
                          {settings.phone_number}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Social Media */}
                  {(settings?.instagram_handle || settings?.facebook_handle || settings?.twitter_handle) && (
                    <div className="pt-4 border-t">
                      <p className="font-light mb-3">Follow Me</p>
                      <div className="flex gap-4">
                        {settings.instagram_handle && (
                          <a
                            href={`https://instagram.com/${settings.instagram_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground hover:text-primary transition-colors"
                          >
                            <Instagram className="h-6 w-6" />
                          </a>
                        )}
                        {settings.facebook_handle && (
                          <a
                            href={`https://facebook.com/${settings.facebook_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground hover:text-primary transition-colors"
                          >
                            <Facebook className="h-6 w-6" />
                          </a>
                        )}
                        {settings.twitter_handle && (
                          <a
                            href={`https://twitter.com/${settings.twitter_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground hover:text-primary transition-colors"
                          >
                            <Twitter className="h-6 w-6" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Send a Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows={6}
                        required
                      />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
