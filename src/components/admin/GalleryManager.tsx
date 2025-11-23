const handleDeleteImage = async (imageId: string, imageUrl: string) => {
  // Confirmation dialog
  const confirmed = window.confirm("Are you sure you want to remove this image?");
  if (!confirmed) return;

  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    console.log('Attempting to delete:', fileName);
    console.log('Full URL:', imageUrl);

    // Delete from storage first
    const { data: storageData, error: storageError } = await supabase.storage
      .from('artwork_images')
      .remove([fileName]);

    if (storageError) {
      console.error("Storage deletion error:", storageError);
      toast({
        title: "Storage Error",
        description: `Failed to delete image from storage: ${storageError.message}`,
        variant: "destructive",
      });
      // Still try to delete from database even if storage fails
    } else {
      console.log("Storage deletion response:", storageData);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("artwork_gallery")
      .delete()
      .eq("id", imageId);

    if (dbError) {
      console.error("Database deletion error:", dbError);
      throw dbError;
    }

    toast({
      title: "Success",
      description: storageError 
        ? "Image removed from gallery (file may still exist in storage)" 
        : "Image removed successfully",
    });
    
    // Refresh the gallery images
    await fetchGalleryImages();
  } catch (error: any) {
    console.error("Error deleting gallery image:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to delete gallery image",
      variant: "destructive",
    });
  }
};
