import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Palette, Check, X } from "lucide-react";

export default function ArtistSignup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"signup" | "claim">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [checkingHandle, setCheckingHandle] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Check if they have a handle
        checkUserHandle(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setStep("claim");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUserHandle = async (userId: string) => {
    const { data } = await supabase
      .from("artist_settings")
      .select("handle")
      .eq("user_id", userId)
      .maybeSingle();

    if (data?.handle) {
      navigate("/admin");
    } else {
      setStep("claim");
    }
  };

  // Validate handle format
  const validateHandle = (value: string): string | null => {
    if (value.length < 3) return "Handle must be at least 3 characters";
    if (value.length > 30) return "Handle must be less than 30 characters";
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(value) && value.length > 2) {
      return "Only lowercase letters, numbers, and hyphens allowed";
    }
    if (value.startsWith("-") || value.endsWith("-")) {
      return "Handle cannot start or end with a hyphen";
    }
    return null;
  };

  // Check handle availability with debounce
  useEffect(() => {
    if (handle.length < 3) {
      setHandleAvailable(null);
      return;
    }

    const error = validateHandle(handle);
    if (error) {
      setHandleAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingHandle(true);
      try {
        const { data, error } = await supabase.rpc("check_handle_available", {
          check_handle: handle.toLowerCase(),
        });
        if (!error) {
          setHandleAvailable(data);
        }
      } catch {
        setHandleAvailable(null);
      } finally {
        setCheckingHandle(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [handle]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.includes("@") || password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email and password (min 6 characters)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
          data: { full_name: "Artist" }
        }
      });

      if (error) throw error;

      toast({
        title: "Account Created!",
        description: "Now let's claim your unique gallery URL.",
      });
      
      setStep("claim");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateHandle(handle);
    if (error) {
      toast({
        title: "Invalid Handle",
        description: error,
        variant: "destructive",
      });
      return;
    }

    if (!handleAvailable) {
      toast({
        title: "Handle Unavailable",
        description: "This handle is already taken. Please choose another.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Session Error",
          description: "Please sign in again.",
          variant: "destructive",
        });
        return;
      }

      // Update artist_settings with the handle
      const { error } = await supabase
        .from("artist_settings")
        .update({ handle: handle.toLowerCase() })
        .eq("user_id", session.user.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Your gallery is live at hyaandco.com/${handle}`,
      });
      
      navigate("/admin");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b py-4 px-6">
        <h1 className="text-xl font-semibold tracking-tight">hya&co</h1>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {step === "signup" ? (
            <div className="space-y-8">
              {/* Hero */}
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Palette className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Launch your independent art career.
                </h2>
                <p className="text-muted-foreground">
                  Create your gallery, own your audience, keep 100% of your sales.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="artist@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                    className="h-12"
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Artist Account
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <a href="/auth" className="text-primary hover:underline">
                  Sign in
                </a>
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Claim Handle Step */}
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-500" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Let's set up your gallery.
                </h2>
                <p className="text-muted-foreground">
                  Choose a unique handle for your public gallery URL.
                </p>
              </div>

              <form onSubmit={handleClaimUrl} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="handle">Choose your unique handle</Label>
                  <div className="flex items-center gap-0 border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                    <span className="px-4 py-3 bg-muted text-muted-foreground text-sm whitespace-nowrap">
                      hyaandco.com/
                    </span>
                    <Input
                      id="handle"
                      type="text"
                      placeholder="artist-name"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="border-0 rounded-none focus-visible:ring-0 h-12"
                      required
                    />
                    <div className="px-3">
                      {checkingHandle && (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      )}
                      {!checkingHandle && handleAvailable === true && (
                        <Check className="h-5 w-5 text-green-500" />
                      )}
                      {!checkingHandle && handleAvailable === false && (
                        <X className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  </div>
                  {handle.length > 0 && (
                    <p className={`text-sm ${handleAvailable === true ? "text-green-500" : handleAvailable === false ? "text-destructive" : "text-muted-foreground"}`}>
                      {checkingHandle ? "Checking availability..." : 
                       handleAvailable === true ? "This handle is available!" :
                       handleAvailable === false ? "This handle is taken" :
                       validateHandle(handle) || "Enter a unique handle"}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base" 
                  disabled={loading || !handleAvailable}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Claim URL & Enter Dashboard
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
