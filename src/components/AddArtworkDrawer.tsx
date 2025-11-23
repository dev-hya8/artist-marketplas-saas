const handleRemoveImage = async () => {
  if (!formData.image_url) {
    setImagePreview(null);
    return;
  }

  try {
    // Extract filename from the public URL
    const urlParts = formData.image_url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    console.log('Attempting to delete file:', fileName);
    console.log('Full URL:', formData.image_url);

    const { data, error: deleteError } = await supabase.storage
      .from('artwork_images')
      .remove([fileName]);

    if (deleteError) {
      console.error("Storage deletion error:", deleteError);
      toast({
        title: "Failed to delete image",
        description: deleteError.message || "Could not delete image from storage",
        variant: "destructive",
      });
      return;
    }

    console.log('Delete response:', data);

    // Clear the image data only after successful deletion
    setImagePreview(null);
    setFormData({ ...formData, image_url: "" });
    
    // Reset the file input
    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }

    toast({
      title: "Image removed",
      description: "The image has been deleted from storage successfully",
    });
  } catch (error: any) {
    console.error("Error deleting image:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to delete image",
      variant: "destructive",
    });
  }
};
