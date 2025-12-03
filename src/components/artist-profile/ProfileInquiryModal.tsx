import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Artwork {
  id: string;
  title: string;
  medium: string;
  dimensions: string;
  price: number;
  imageUrl: string;
}

interface ProfileInquiryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artwork: Artwork | null;
}

export function ProfileInquiryModal({ 
  open, 
  onOpenChange, 
  artwork 
}: ProfileInquiryModalProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create inquiry in database
      const { error } = await supabase.from("inquiries").insert({
        artwork_id: artwork?.id || null,
        name: email.split("@")[0], // Use email prefix as name placeholder
        email: email.trim(),
        inquiry_type: artwork ? "Purchase Inquiry" : "General Inquiry",
        message: message.trim() || `Interested in ${artwork?.title || "your work"}.`,
      });

      if (error) throw error;

      toast({
        title: "Inquiry sent!",
        description: "Hya will get back to you soon.",
      });

      setEmail("");
      setMessage("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error submitting inquiry:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send inquiry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl p-0 overflow-hidden">
        {/* Artwork Preview (if selected) */}
        {artwork && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6 text-white">
              <h3 className="font-serif text-xl">{artwork.title}</h3>
              <p className="text-sm text-white/80">{artwork.medium}</p>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="p-8 space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="font-serif text-2xl text-neutral-900">
              {artwork ? "Interested in this piece?" : "Get in Touch"}
            </h2>
            <p className="text-sm text-neutral-500">
              {artwork 
                ? "Enter your email to message Hya directly about this work."
                : "Enter your email to start a conversation with Hya."
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-neutral-200 focus:border-neutral-900 focus:ring-neutral-900 placeholder:text-neutral-400"
                required
              />
            </div>

            <div>
              <textarea
                placeholder="Add a message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-3 border border-neutral-200 rounded-md text-sm resize-none focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 placeholder:text-neutral-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-neutral-900 text-white text-sm tracking-wide uppercase hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Inquiry"}
            </button>
          </form>

          <p className="text-xs text-center text-neutral-400">
            By submitting, you agree to receive communications from this artist.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
