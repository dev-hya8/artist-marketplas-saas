import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Check, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClaimHandleModalProps {
  open: boolean;
  onSuccess: (handle: string) => void;
}

export const ClaimHandleModal = ({ open, onSuccess }: ClaimHandleModalProps) => {
  const [handle, setHandle] = useState("");
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [checkingHandle, setCheckingHandle] = useState(false);
  const [saving, setSaving] = useState(false);

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

    setCheckingHandle(true);
    const timer = setTimeout(async () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateHandle(handle);
    if (error) {
      toast.error(error);
      return;
    }

    if (!handleAvailable) {
      toast.error("This handle is already taken");
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in again");
        return;
      }

      const { error } = await supabase
        .from("artist_settings")
        .update({ handle: handle.toLowerCase() })
        .eq("user_id", session.user.id);

      if (error) throw error;

      toast.success(`Your gallery is live at hyaandco.com/${handle}`);
      onSuccess(handle.toLowerCase());
    } catch (error: any) {
      toast.error(error.message || "Failed to claim handle");
    } finally {
      setSaving(false);
    }
  };

  const getValidationMessage = () => {
    if (handle.length === 0) return null;
    
    const formatError = validateHandle(handle);
    if (formatError) {
      return <span className="text-muted-foreground">{formatError}</span>;
    }
    
    if (checkingHandle) {
      return <span className="text-muted-foreground">Checking availability...</span>;
    }
    
    if (handleAvailable === true) {
      return <span className="text-green-500">✅ hyaandco.com/{handle} is available!</span>;
    }
    
    if (handleAvailable === false) {
      return <span className="text-destructive">🚫 This handle is already claimed. Please try another.</span>;
    }
    
    return null;
  };

  const getInputBorderClass = () => {
    if (handle.length < 3 || checkingHandle) return "";
    const formatError = validateHandle(handle);
    if (formatError) return "";
    if (handleAvailable === true) return "border-green-500 focus-within:ring-green-500";
    if (handleAvailable === false) return "border-destructive focus-within:ring-destructive";
    return "";
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Claim Your Gallery URL
          </DialogTitle>
          <DialogDescription className="text-center">
            Choose a unique handle for your public gallery. This will be your permanent link.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-3">
            <Label htmlFor="handle">Your unique handle</Label>
            <div className={cn(
              "flex items-center gap-0 border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring transition-colors",
              getInputBorderClass()
            )}>
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
                autoFocus
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
              {getValidationMessage()}
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12" 
            disabled={saving || !handleAvailable || checkingHandle}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Claim URL & Continue
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
