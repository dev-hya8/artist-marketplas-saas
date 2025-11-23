import { useState, useEffect } from "react";
import { User, Camera, Upload, Plus, Trash2 } from "lucide-react";
import { FaInstagram, FaFacebook, FaXTwitter, FaTiktok } from "react-icons/fa6";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ArtistProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  avatarUrl: string | null;
  onAvatarUpdate: (url: string) => void;
}

export const ArtistProfileDrawer = ({ open, onOpenChange, avatarUrl, onAvatarUpdate }: ArtistProfileDrawerProps) => {
  interface EventItem {
    title: string;
    date: string;
  }

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [artistSettingsId, setArtistSettingsId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    contact_email: "",
    phone_number: "",
    instagram_handle: "",
    facebook_handle: "",
    twitter_handle: "",
    tiktok_handle: "",
    cv_exhibitions: [] as EventItem[],
    upcoming_events: [] as EventItem[],
  });

  useEffect(() => {
    if (open) {
      fetchProfileData();
    }
  }, [open]);

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from("artist_settings")
        .select("id, contact_email, phone_number, instagram_handle, facebook_handle, twitter_handle, tiktok_handle, cv_exhibitions, upcoming_events")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setArtistSettingsId(data.id);
        
        // Parse exhibitions and events from JSON
        let exhibitions: EventItem[] = [];
        let events: EventItem[] = [];
        
        try {
          if (data.cv_exhibitions) {
            const parsed = typeof data.cv_exhibitions === 'string' 
              ? JSON.parse(data.cv_exhibitions)
              : data.cv_exhibitions;
            
            // Handle both old format (string[]) and new format (EventItem[])
            if (Array.isArray(parsed)) {
              exhibitions = parsed.map(item => 
                typeof item === 'string' 
                  ? { title: item, date: '' }
                  : item
              );
            }
          }
        } catch {
          exhibitions = [];
        }
        
        try {
          if (data.upcoming_events) {
            const parsed = typeof data.upcoming_events === 'string'
              ? JSON.parse(data.upcoming_events)
              : data.upcoming_events;
            
            // Handle both old format (string[]) and new format (EventItem[])
            if (Array.isArray(parsed)) {
              events = parsed.map(item => 
                typeof item === 'string'
                  ? { title: item, date: '' }
                  : item
              );
            }
          }
        } catch {
          events = [];
        }
        
        setFormData({
          contact_email: data.contact_email || "",
          phone_number: data.phone_number || "",
          instagram_handle: data.instagram_handle || "",
          facebook_handle: data.facebook_handle || "",
          twitter_handle: data.twitter_handle || "",
          tiktok_handle: data.tiktok_handle || "",
          cv_exhibitions: exhibitions,
          upcoming_events: events,
        });
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (2MB limit for avatars)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File too large. Please select an image smaller than 2MB");
      e.target.value = "";
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update database - if we have an ID, update that specific row
      if (artistSettingsId) {
        const { error: updateError } = await supabase
          .from("artist_settings")
          .update({ avatar_url: publicUrl })
          .eq('id', artistSettingsId);

        if (updateError) throw updateError;
      } else {
        // If no ID yet, create a new row
        const { error: insertError } = await supabase
          .from("artist_settings")
          .insert({ avatar_url: publicUrl });

        if (insertError) throw insertError;
      }

      // Update parent component
      onAvatarUpdate(publicUrl);
      toast.success("Profile photo updated!");
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        contact_email: formData.contact_email,
        phone_number: formData.phone_number,
        instagram_handle: formData.instagram_handle,
        facebook_handle: formData.facebook_handle,
        twitter_handle: formData.twitter_handle,
        tiktok_handle: formData.tiktok_handle,
        cv_exhibitions: JSON.stringify(formData.cv_exhibitions.filter(e => e.title.trim())),
        upcoming_events: JSON.stringify(formData.upcoming_events.filter(e => e.title.trim())),
      };

      if (artistSettingsId) {
        const { error } = await supabase
          .from("artist_settings")
          .update(updateData)
          .eq('id', artistSettingsId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("artist_settings")
          .insert(updateData);

        if (error) throw error;
      }

      toast.success("Profile updated successfully!");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const addExhibition = () => {
    setFormData({ ...formData, cv_exhibitions: [...formData.cv_exhibitions, { title: "", date: "" }] });
  };

  const removeExhibition = (index: number) => {
    setFormData({
      ...formData,
      cv_exhibitions: formData.cv_exhibitions.filter((_, i) => i !== index),
    });
  };

  const updateExhibition = (index: number, field: 'title' | 'date', value: string) => {
    const newExhibitions = [...formData.cv_exhibitions];
    newExhibitions[index] = { ...newExhibitions[index], [field]: value };
    setFormData({ ...formData, cv_exhibitions: newExhibitions });
  };

  const addEvent = () => {
    setFormData({ ...formData, upcoming_events: [...formData.upcoming_events, { title: "", date: "" }] });
  };

  const removeEvent = (index: number) => {
    setFormData({
      ...formData,
      upcoming_events: formData.upcoming_events.filter((_, i) => i !== index),
    });
  };

  const updateEvent = (index: number, field: 'title' | 'date', value: string) => {
    const newEvents = [...formData.upcoming_events];
    newEvents[index] = { ...newEvents[index], [field]: value };
    setFormData({ ...formData, upcoming_events: newEvents });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6" />
          Artist Profile
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Upload Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Profile Photo</h3>
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Profile photo" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-16 w-16 text-muted-foreground" />
                )}
              </div>
              
              {/* Camera Icon Overlay */}
              <button
                type="button"
                onClick={() => document.getElementById('profile-avatar-upload')?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
              >
                {uploadingAvatar ? (
                  <Upload className="h-8 w-8 text-white animate-pulse" />
                ) : (
                  <Camera className="h-8 w-8 text-white" />
                )}
              </button>
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              id="profile-avatar-upload"
              disabled={uploadingAvatar}
            />
            
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Contact Information</h3>
          
          <div className="space-y-2">
            <Label htmlFor="contact_email">Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="+639765287844"
            />
          </div>
        </div>

        {/* Social Media Links */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Social Media Links</h3>
          
          <div className="space-y-2">
            <Label htmlFor="instagram_handle">
              <div className="flex items-center gap-2">
                <FaInstagram className="h-4 w-4" />
                Instagram
              </div>
            </Label>
            <Input
              id="instagram_handle"
              value={formData.instagram_handle}
              onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
              placeholder="Username or Full URL"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook_handle">
              <div className="flex items-center gap-2">
                <FaFacebook className="h-4 w-4" />
                Facebook
              </div>
            </Label>
            <Input
              id="facebook_handle"
              value={formData.facebook_handle}
              onChange={(e) => setFormData({ ...formData, facebook_handle: e.target.value })}
              placeholder="Username or Full URL"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter_handle">
              <div className="flex items-center gap-2">
                <FaXTwitter className="h-4 w-4" />
                X (Twitter)
              </div>
            </Label>
            <Input
              id="twitter_handle"
              value={formData.twitter_handle}
              onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value })}
              placeholder="Username or Full URL"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tiktok_handle">
              <div className="flex items-center gap-2">
                <FaTiktok className="h-4 w-4" />
                TikTok
              </div>
            </Label>
            <Input
              id="tiktok_handle"
              value={formData.tiktok_handle}
              onChange={(e) => setFormData({ ...formData, tiktok_handle: e.target.value })}
              placeholder="Username or Full URL"
            />
          </div>
        </div>

        {/* CV / Exhibitions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">CV / Exhibitions</h3>
          
          <div className="space-y-2">
            <Label>Exhibitions</Label>
            <div className="space-y-2">
              {formData.cv_exhibitions.map((exhibition, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={exhibition.title}
                    onChange={(e) => updateExhibition(index, 'title', e.target.value)}
                    placeholder="Exhibition name"
                    className="flex-1"
                  />
                  <Input
                    value={exhibition.date}
                    onChange={(e) => updateExhibition(index, 'date', e.target.value)}
                    placeholder="Year/Date"
                    className="w-32"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExhibition(index)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addExhibition}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Exhibition
              </Button>
            </div>
          </div>
        </div>

        {/* Upcoming Art Events */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Upcoming Art Events</h3>
          
          <div className="space-y-2">
            <Label>Events</Label>
            <div className="space-y-2">
              {formData.upcoming_events.map((event, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={event.title}
                    onChange={(e) => updateEvent(index, 'title', e.target.value)}
                    placeholder="Event name"
                    className="flex-1"
                  />
                  <Input
                    value={event.date}
                    onChange={(e) => updateEvent(index, 'date', e.target.value)}
                    placeholder="Year/Date"
                    className="w-32"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEvent(index)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEvent}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </div>
  );
};
