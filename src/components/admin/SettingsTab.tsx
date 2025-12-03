import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Lock } from "lucide-react";
import { PaymentSettingsCard } from "./PaymentSettingsCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const SettingsTab = () => {
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [publicProfileEnabled, setPublicProfileEnabled] = useState(true);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const navigate = useNavigate();

  // Initialize dark mode from localStorage and fetch settings
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark";
    setIsDarkMode(isDark);
    
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("artist_settings")
        .select("email_alerts_enabled, public_profile_enabled")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setEmailAlertsEnabled(data.email_alerts_enabled ?? true);
        setPublicProfileEnabled(data.public_profile_enabled ?? true);
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    }
  };

  const updateSetting = async (field: string, value: boolean) => {
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
        .update({ [field]: value })
        .eq("id", existing.id);

      if (error) throw error;

      toast.success("Setting updated successfully");
    } catch (error: any) {
      console.error("Error updating setting:", error);
      toast.error(error.message || "Failed to update setting");
    }
  };

  const toggleDarkMode = (checked: boolean) => {
    setIsDarkMode(checked);
    localStorage.setItem("theme", checked ? "dark" : "light");
    
    if (checked) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleEmailAlerts = (checked: boolean) => {
    setEmailAlertsEnabled(checked);
    updateSetting("email_alerts_enabled", checked);
  };

  const togglePublicProfile = (checked: boolean) => {
    setPublicProfileEnabled(checked);
    updateSetting("public_profile_enabled", checked);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setPasswordDialogOpen(false);
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleExportInventory = async () => {
    try {
      const { data: artworks, error } = await supabase
        .from("artworks")
        .select("title, price, base_currency, dimensions, dimension_unit, medium, status, location, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Convert to CSV
      const headers = ["Title", "Price", "Currency", "Dimensions", "Unit", "Medium", "Status", "Location", "Created"];
      const rows = artworks.map(artwork => [
        artwork.title || "",
        artwork.price || "",
        artwork.base_currency || "",
        artwork.dimensions || "",
        artwork.dimension_unit || "",
        artwork.medium || "",
        artwork.status || "",
        artwork.location || "",
        artwork.created_at ? new Date(artwork.created_at).toLocaleDateString() : ""
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `artwork-inventory-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Inventory exported successfully");
    } catch (error: any) {
      console.error("Error exporting inventory:", error);
      toast.error(error.message || "Failed to export inventory");
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast.error(error.message || "Failed to sign out");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      toast.error("Account deletion is not yet implemented. Please contact support.");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error(error.message || "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Payment Integration Section */}
      <PaymentSettingsCard />

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the app looks to you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Toggle between light and dark theme
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={isDarkMode}
              onCheckedChange={toggleDarkMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage your account security settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Change Password</Label>
              <p className="text-sm text-muted-foreground">
                Update your account password
              </p>
            </div>
            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your current password and choose a new one
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleChangePassword} disabled={loading}>
                    {loading ? "Updating..." : "Update Password"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage how you receive updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-alerts">New Inquiry Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Receive an email whenever someone sends an inquiry about your artwork
              </p>
            </div>
            <Switch
              id="email-alerts"
              checked={emailAlertsEnabled}
              onCheckedChange={toggleEmailAlerts}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Visibility Section */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy & Visibility</CardTitle>
          <CardDescription>Control your public presence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public-profile">Public Profile</Label>
              <p className="text-sm text-muted-foreground">
                When off, your profile is hidden from the public gallery, but you can still access your dashboard
              </p>
            </div>
            <Switch
              id="public-profile"
              checked={publicProfileEnabled}
              onCheckedChange={togglePublicProfile}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export and manage your data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Export Inventory</Label>
              <p className="text-sm text-muted-foreground">
                Download a CSV file with all your artwork data
              </p>
            </div>
            <Button variant="ghost" onClick={handleExportInventory}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>Account Management</CardTitle>
          <CardDescription>Manage your account and security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sign Out Button */}
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label>Sign Out</Label>
              <p className="text-sm text-muted-foreground">
                Sign out of your account
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleSignOut}
              disabled={loading}
            >
              {loading ? "Signing out..." : "Sign Out"}
            </Button>
          </div>

          {/* Delete Account Button */}
          <div className="pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={loading}
                >
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove all your data from our servers, including all
                    artworks, images, and settings.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
