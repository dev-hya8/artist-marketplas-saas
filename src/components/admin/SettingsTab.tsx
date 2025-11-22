import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const SettingsTab = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    contact_email: "",
    bio_text: "",
    bio_image_url: "",
    measurement_unit: "in",
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
      });
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
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
        })
        .eq("id", existing.id);

      if (error) throw error;

      toast.success("Settings updated successfully");
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast.error(error.message || "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Artist Settings</CardTitle>
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
            <Label htmlFor="bio_text">Artist Bio / Statement</Label>
            <Textarea
              id="bio_text"
              value={formData.bio_text}
              onChange={(e) => setFormData({ ...formData, bio_text: e.target.value })}
              placeholder="Write your artist statement or bio here..."
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio_image_url">Bio Image URL</Label>
            <Input
              id="bio_image_url"
              type="url"
              value={formData.bio_image_url}
              onChange={(e) => setFormData({ ...formData, bio_image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
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
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
