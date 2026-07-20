import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Palette, Check, X, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Session } from "@supabase/supabase-js";

export default function ArtistSignup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [step, setStep] = useState<"signup" | "confirm-email" | "claim">("signup");
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [checkingHandle, setCheckingHandle] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      
      if (event === 'SIGNED_IN' && currentSession) {
        // Defer the handle check to avoid deadlock
        setTimeout(() => {
          checkUserHandle(currentSession.user.id);
        }, 0);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setCheckingSession(false);
      
      if (existingSession) {
        checkUserHandle(existingSession.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
    toast({
      title: "Demo Mode",
      description: "Account creation is disabled in the demo.",
    });
  };

  const handleClaimUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateHandle(handle);
    if (validationError) {
      toast({
        title: "Invalid Handle",
        description: validationError,
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

    // Strictly check session before proceeding
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (!currentSession) {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please sign in again.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      // First check if artist_settings row exists
      const { data: existingSettings } = await supabase
        .from("artist_settings")
        .select("id")
        .eq("user_id", currentSession.user.id)
        .maybeSingle();

      let error;
      
      if (existingSettings) {
        // Update existing row
        const result = await supabase
          .from("artist_settings")
          .update({ handle: handle.toLowerCase() })
          .eq("user_id", currentSession.user.id);
        error = result.error;
      } else {
        // Insert new row if trigger didn't create one
        const result = await supabase
          .from("artist_settings")
          .insert({ 
            user_id: currentSession.user.id,
            handle: handle.toLowerCase(),
            display_name: "Artist"
          });
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Your gallery is live at artha.co/${handle}`,
      });
      
      navigate("/gallery-ready");
    } catch (error: any) {
      console.error("Claim handle error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to claim handle",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b py-4 px-6">
        <div className="flex items-center justify-center">
          <Link 
            to="/" 
            className="font-serif text-2xl tracking-tight text-foreground transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary rounded-md px-2 py-1"
          >
            Artha
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {step === "confirm-email" ? (
            <div className="space-y-8">
              <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Check your email
                </h2>
                <p className="text-muted-foreground">
                  We sent a confirmation link to <strong>{email}</strong>. 
                  Click the link to verify your account and continue setting up your gallery.
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the email?{" "}
                  <button 
                    onClick={() => setStep("signup")}
                    className="text-primary hover:underline"
                  >
                    Try again
                  </button>
                </p>
              </div>
            </div>
          ) : step === "signup" ? (
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
                  <div className={cn(
                    "flex items-center gap-0 border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring transition-colors",
                    handle.length >= 3 && !checkingHandle && !validateHandle(handle) && handleAvailable === true && "border-green-500 focus-within:ring-green-500",
                    handle.length >= 3 && !checkingHandle && !validateHandle(handle) && handleAvailable === false && "border-destructive focus-within:ring-destructive"
                  )}>
                    <span className="px-4 py-3 bg-muted text-muted-foreground text-sm whitespace-nowrap">
                      artha.co/
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
                    <div className="px-3 flex items-center justify-center w-10">
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
                  <p className="text-sm min-h-[20px]">
                    {handle.length === 0 ? null :
                     validateHandle(handle) ? <span className="text-muted-foreground">{validateHandle(handle)}</span> :
                     checkingHandle ? <span className="text-muted-foreground">Checking availability...</span> : 
                     handleAvailable === true ? <span className="text-green-500">✅ artha.co/{handle} is available!</span> :
                     handleAvailable === false ? <span className="text-destructive">🚫 This handle is already claimed. Please try another.</span> :
                     null}
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base" 
                  disabled={loading || !handleAvailable || checkingHandle}
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
