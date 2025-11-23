import { useState, useEffect } from "react";
import { User, Camera, Upload } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    contact_email: "",
    phone_number: "",
    instagram_handle: "",
    facebook_handle: "",
    twitter_handle: "",
    cv_exhibitions: "",
    upcoming_events: "",
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
        .select("contact_email, phone_number, instagram_handle, facebook_handle, twitter_handle, cv_exhibitions, upcoming_events")
        .single();

      if (error) throw error;

      setFormData({
        contact_email: data.contact_email || "",
        phone_number: data.phone_number || "",
        instagram_handle: data.instagram_handle || "",
        facebook_handle: data.facebook_handle || "",
        twitter_handle: data.twitter_handle || "",
        cv_exhibitions: data.cv_exhibitions || "",
        upcoming_events: data.upcoming_events || "",
      });
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

      // Update database
      const { data: existing } = await supabase
        .from("artist_settings")
        .select("id")
        .maybeSingle();

      if (!existing) {
        throw new Error("Settings not found");
      }

      const { error: updateError } = await supabase
        .from("artist_settings")
        .update({ avatar_url: publicUrl })
        .eq("id", existing.id);

      if (updateError) throw updateError;

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
      const { data: existing } = await supabase
        .from("artist_settings")
        .select("id")
        .single();

      if (!existing) {
        throw new Error("Settings not found");
      }

      const { error } = await supabase
        .from("artist_settings")
        .update({
          contact_email: formData.contact_email,
          phone_number: formData.phone_number,
          instagram_handle: formData.instagram_handle,
          facebook_handle: formData.facebook_handle,
          twitter_handle: formData.twitter_handle,
          cv_exhibitions: formData.cv_exhibitions,
          upcoming_events: formData.upcoming_events,
        })
        .eq("id", existing.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Artist Profile
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="overflow-y-auto px-4 pb-6">
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
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('profile-avatar-upload')?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? "Uploading..." : "Change Photo"}
                </Button>
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
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Social Media Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Social Media Links</h3>
              
              <div className="space-y-2">
                <Label htmlFor="instagram_handle">Instagram</Label>
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
                <Label htmlFor="facebook_handle">Facebook</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">facebook.com/</span>
                  <Input
                    id="facebook_handle"
                    value={formData.facebook_handle}
                    onChange={(e) => setFormData({ ...formData, facebook_handle: e.target.value })}
                    placeholder="yourpage"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter_handle">X (Twitter)</Label>
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
            </div>

            {/* CV / Exhibitions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">CV / Exhibitions</h3>
              
              <div className="space-y-2">
                <Label htmlFor="cv_exhibitions">Exhibitions</Label>
                <Textarea
                  id="cv_exhibitions"
                  value={formData.cv_exhibitions}
                  onChange={(e) => setFormData({ ...formData, cv_exhibitions: e.target.value })}
                  placeholder="List your exhibitions, one per line..."
                  rows={6}
                />
              </div>
            </div>

            {/* Upcoming Art Events */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Upcoming Art Events</h3>
              
              <div className="space-y-2">
                <Label htmlFor="upcoming_events">Events</Label>
                <Textarea
                  id="upcoming_events"
                  value={formData.upcoming_events}
                  onChange={(e) => setFormData({ ...formData, upcoming_events: e.target.value })}
                  placeholder="List your upcoming events, one per line..."
                  rows={6}
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
