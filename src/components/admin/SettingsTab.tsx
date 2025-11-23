import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

export const SettingsTab = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bioImagePreview, setBioImagePreview] = useState<string | null>(null);
  const { refetchCurrency } = useCurrency();
  const [formData, setFormData] = useState({
    display_name: "",
    contact_email: "",
    bio_text: "",
    bio_image_url: "",
    measurement_unit: "in",
    currency_region: "US",
    phone_number: "",
    instagram_handle: "",
    facebook_handle: "",
    twitter_handle: "",
    primary_contact_method: "form",
    cv_exhibitions: "",
    cv_education: "",
    cv_awards: "",
    upcoming_events: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("artist_settings")
        .select("*")
        .single();

      if (error) throw error;

      setFormData({
        display_name: data.display_name || "",
        contact_email: data.contact_email || "",
        bio_text: data.bio_text || "",
        bio_image_url: data.bio_image_url || "",
        measurement_unit: data.measurement_unit || "in",
        currency_region: data.currency_region || "US",
        phone_number: data.phone_number || "",
        instagram_handle: data.instagram_handle || "",
        facebook_handle: data.facebook_handle || "",
        twitter_handle: data.twitter_handle || "",
        primary_contact_method: data.primary_contact_method || "form",
        cv_exhibitions: data.cv_exhibitions || "",
        cv_education: data.cv_education || "",
        cv_awards: data.cv_awards || "",
        upcoming_events: data.upcoming_events || "",
      });
      setBioImagePreview(data.bio_image_url || null);
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    }
  };

  const handleBioImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File too large. Please select an image smaller than 5MB");
      e.target.value = "";
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setBioImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `bio-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('artwork_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('artwork_images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, bio_image_url: publicUrl });
      toast.success("Bio image uploaded successfully");
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast.error(error.message || "Failed to upload image");
      setBioImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get the existing settings
      const { data: existing } = await supabase
        .from("artist_settings")
        .select("id")
        .single();

      if (!existing) {
        throw new Error("Settings not found");
      }

      // Update the settings
      const { error } = await supabase
        .from("artist_settings")
        .update({
          display_name: formData.display_name,
          contact_email: formData.contact_email,
          bio_text: formData.bio_text,
          bio_image_url: formData.bio_image_url,
          measurement_unit: formData.measurement_unit,
          currency_region: formData.currency_region,
          phone_number: formData.phone_number,
          instagram_handle: formData.instagram_handle,
          facebook_handle: formData.facebook_handle,
          twitter_handle: formData.twitter_handle,
          primary_contact_method: formData.primary_contact_method,
          cv_exhibitions: formData.cv_exhibitions,
          cv_education: formData.cv_education,
          cv_awards: formData.cv_awards,
          upcoming_events: formData.upcoming_events,
        })
        .eq("id", existing.id);

      if (error) throw error;

      toast.success("Profile updated!");
      
      // Refetch currency if it was changed
      await refetchCurrency();
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast.error(error.message || "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="measurement_unit">Preferred Measurement Unit</Label>
              <Select 
                value={formData.measurement_unit} 
                onValueChange={(value) => setFormData({ ...formData, measurement_unit: value })}
              >
                <SelectTrigger id="measurement_unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Inches (in)</SelectItem>
                  <SelectItem value="cm">Centimeters (cm)</SelectItem>
                  <SelectItem value="ft">Feet (ft)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency_region">Base Currency</Label>
              <Select 
                value={formData.currency_region} 
                onValueChange={(value) => setFormData({ ...formData, currency_region: value })}
              >
                <SelectTrigger id="currency_region">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">$ - US Dollar (USD)</SelectItem>
                  <SelectItem value="PH">₱ - Philippine Peso (PHP)</SelectItem>
                  <SelectItem value="EU">€ - Euro (EUR)</SelectItem>
                  <SelectItem value="GB">£ - British Pound (GBP)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This is the currency your artwork prices will be displayed in
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Artist Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Artist Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio_image">Bio Image</Label>
              <div className="flex items-start gap-4">
                {bioImagePreview && (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                    <img 
                      src={bioImagePreview} 
                      alt="Bio preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="bio_image"
                    type="file"
                    accept="image/*"
                    onChange={handleBioImageUpload}
                    disabled={uploading}
                  />
                  {uploading && <p className="text-sm text-muted-foreground mt-1">Uploading image...</p>}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio_text">Artist Bio / Statement</Label>
              <Textarea
                id="bio_text"
                value={formData.bio_text}
                onChange={(e) => setFormData({ ...formData, bio_text: e.target.value })}
                placeholder="Write your artist statement or bio here..."
                rows={8}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Contact & Social Media */}
      <Card>
        <CardHeader>
          <CardTitle>Contact & Social Media</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram_handle">Instagram Handle</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">@</span>
                <Input
                  id="instagram_handle"
                  value={formData.instagram_handle}
                  onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                  placeholder="yourusername"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook_handle">Facebook Handle</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">facebook.com/</span>
                <Input
                  id="facebook_handle"
                  value={formData.facebook_handle}
                  onChange={(e) => setFormData({ ...formData, facebook_handle: e.target.value })}
                  placeholder="yourpage"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter_handle">X (Twitter) Handle</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">@</span>
                <Input
                  id="twitter_handle"
                  value={formData.twitter_handle}
                  onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value })}
                  placeholder="yourusername"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Primary Contact Method</Label>
              <RadioGroup
                value={formData.primary_contact_method}
                onValueChange={(value) => setFormData({ ...formData, primary_contact_method: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="form" id="form" />
                  <Label htmlFor="form" className="font-normal cursor-pointer">Use Contact Form</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="font-normal cursor-pointer">Display Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="phone" id="phone" />
                  <Label htmlFor="phone" className="font-normal cursor-pointer">Display Phone</Label>
                </div>
              </RadioGroup>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* CV / Professional Info */}
      <Card>
        <CardHeader>
          <CardTitle>CV / Professional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cv_exhibitions">Exhibitions</Label>
              <Textarea
                id="cv_exhibitions"
                value={formData.cv_exhibitions}
                onChange={(e) => setFormData({ ...formData, cv_exhibitions: e.target.value })}
                placeholder="List your exhibitions, one per line..."
                rows={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cv_education">Education</Label>
              <Textarea
                id="cv_education"
                value={formData.cv_education}
                onChange={(e) => setFormData({ ...formData, cv_education: e.target.value })}
                placeholder="List your education background..."
                rows={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cv_awards">Awards & Recognition</Label>
              <Textarea
                id="cv_awards"
                value={formData.cv_awards}
                onChange={(e) => setFormData({ ...formData, cv_awards: e.target.value })}
                placeholder="List your awards and recognition..."
                rows={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="upcoming_events">Upcoming Art Events</Label>
              <Textarea
                id="upcoming_events"
                value={formData.upcoming_events}
                onChange={(e) => setFormData({ ...formData, upcoming_events: e.target.value })}
                placeholder="List your upcoming events, one per line..."
                rows={8}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button 
        type="submit" 
        onClick={handleSubmit} 
        disabled={loading || uploading}
        className="w-full"
      >
        {loading ? "Saving..." : uploading ? "Uploading..." : "Save Profile"}
      </Button>
    </div>
  );
};
