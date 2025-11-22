import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Trash2 } from "lucide-react";
import type { Tables, Database } from "@/integrations/supabase/types";

type Artwork = Tables<"artworks">;
type ArtworkStatus = Database["public"]["Enums"]["artwork_status"];

interface EditArtworkDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artwork: Artwork;
  onSuccess: () => void;
  onClose: () => void;
}

export const EditArtworkDrawer = ({
  open,
  onOpenChange,
  artwork,
  onSuccess,
  onClose,
}: EditArtworkDrawerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showSoldDialog, setShowSoldDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [soldData, setSoldData] = useState({
    buyer_email: "",
    final_price: "",
  });
  const [formData, setFormData] = useState({
    title: artwork.title,
    image_url: artwork.image_url || "",
    price: artwork.price?.toString() || "",
    status: artwork.status,
    dimensions: artwork.dimensions || "",
    medium: artwork.medium || "",
    location: artwork.location || "",
    provenance_log: artwork.provenance_log || "",
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("artworks")
        .update({
          title: formData.title,
          image_url: formData.image_url || null,
          price: formData.price ? parseFloat(formData.price) : null,
          status: formData.status,
          dimensions: formData.dimensions || null,
          medium: formData.medium || null,
          location: formData.location || null,
          provenance_log: formData.provenance_log || null,
        })
        .eq("id", artwork.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Artwork updated successfully",
      });
      
      onSuccess();
      onClose();
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

  const handleMarkAsSold = () => {
    setShowSoldDialog(true);
  };

  const handleConfirmSold = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("artworks")
        .update({
          status: "Sold",
          buyer_email: soldData.buyer_email,
          price: soldData.final_price ? parseFloat(soldData.final_price) : artwork.price,
        })
        .eq("id", artwork.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Artwork marked as sold",
      });
      
      setShowSoldDialog(false);
      setSoldData({ buyer_email: "", final_price: "" });
      onSuccess();
      onClose();
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

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setLoading(true);

    try {
      // First, delete the image from storage if it exists
      if (artwork.image_url) {
        try {
          // Extract filename from the public URL
          const urlParts = artwork.image_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          
          const { error: storageError } = await supabase.storage
            .from('artwork_images')
            .remove([fileName]);

          if (storageError) {
            console.error("Storage deletion error:", storageError);
            // Continue with database deletion even if storage deletion fails
          }
        } catch (storageError: any) {
          console.error("Storage deletion error:", storageError);
          // Continue with database deletion
        }
      }

      // Delete the database record
      const { error: dbError } = await supabase
        .from("artworks")
        .delete()
        .eq("id", artwork.id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Artwork deleted successfully",
      });
      
      setShowDeleteDialog(false);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Artwork deletion error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete artwork",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Artwork</DrawerTitle>
            <DrawerDescription>Update the details of your artwork</DrawerDescription>
          </DrawerHeader>
          <form onSubmit={handleUpdate} className="px-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-image_url">Image URL</Label>
              <Input
                id="edit-image_url"
                type="url"
                placeholder="https://..."
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-price">Price</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as ArtworkStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                  <SelectItem value="On Loan">On Loan</SelectItem>
                  <SelectItem value="Reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dimensions">Dimensions</Label>
              <Input
                id="edit-dimensions"
                placeholder="e.g., 24x36 inches"
                value={formData.dimensions}
                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-medium">Medium</Label>
              <Input
                id="edit-medium"
                placeholder="e.g., Oil on canvas"
                value={formData.medium}
                onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                placeholder="e.g., Studio, Gallery X"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-provenance">Provenance Log</Label>
              <Textarea
                id="edit-provenance"
                placeholder="History of ownership..."
                value={formData.provenance_log}
                onChange={(e) => setFormData({ ...formData, provenance_log: e.target.value })}
                rows={3}
              />
            </div>

            <DrawerFooter className="px-0 pb-4">
              {artwork.status !== "Sold" && (
                <Button
                  type="button"
                  variant="default"
                  onClick={handleMarkAsSold}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Mark as Sold
                </Button>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Artwork"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Artwork
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={showSoldDialog} onOpenChange={setShowSoldDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Sold</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the buyer's information to complete the sale.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="buyer_email">Buyer Email *</Label>
              <Input
                id="buyer_email"
                type="email"
                placeholder="buyer@example.com"
                value={soldData.buyer_email}
                onChange={(e) => setSoldData({ ...soldData, buyer_email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="final_price">Final Sale Price</Label>
              <Input
                id="final_price"
                type="number"
                step="0.01"
                placeholder={artwork.price?.toString() || "0.00"}
                value={soldData.final_price}
                onChange={(e) => setSoldData({ ...soldData, final_price: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to keep current price: ${artwork.price?.toLocaleString() || "N/A"}
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSoldData({ buyer_email: "", final_price: "" })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSold}
              disabled={!soldData.buyer_email || loading}
            >
              {loading ? "Processing..." : "Confirm Sale"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Artwork</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this artwork? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
