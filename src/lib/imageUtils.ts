import imageCompression from 'browser-image-compression';

/**
 * Converts a Supabase storage URL to use image transformations
 * @param url Original storage URL
 * @param width Target width (default: 400)
 * @param format Target format (default: webp)
 * @returns Transformed image URL
 */
export const getOptimizedImageUrl = (
  url: string | null,
  width: number = 400,
  format: 'webp' | 'avif' | 'origin' = 'webp'
): string | null => {
  if (!url) return null;
  
  // Check if it's a Supabase storage URL
  const supabaseStoragePattern = /supabase\.co\/storage\/v1\/object\/public\//;
  
  if (!supabaseStoragePattern.test(url)) {
    return url; // Return original URL if not Supabase storage
  }
  
  // Convert to render endpoint with transformations
  const transformedUrl = url.replace(
    '/storage/v1/object/public/',
    `/storage/v1/render/image/public/`
  );
  
  // Add transformation parameters
  return `${transformedUrl}?width=${width}&format=${format}&quality=80`;
};

/**
 * Compresses an image file before upload
 * @param file Original file
 * @param maxSizeMB Maximum size in MB (default: 2)
 * @returns Compressed file
 */
export const compressImage = async (
  file: File,
  maxSizeMB: number = 2
): Promise<File> => {
  const options = {
    maxSizeMB,
    maxWidthOrHeight: 2048,
    useWebWorker: true,
    fileType: 'image/jpeg',
  };

  try {
    console.log(`🗜️ Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    
    // If file is already small enough, return it
    if (file.size <= maxSizeMB * 1024 * 1024) {
      console.log('✅ File size is acceptable, no compression needed');
      return file;
    }

    const compressedFile = await imageCompression(file, options);
    console.log(`✅ Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    
    return compressedFile;
  } catch (error) {
    console.error('❌ Compression error:', error);
    // Return original file if compression fails
    return file;
  }
};

/**
 * Generates a tiny blur placeholder data URL from an image
 * @param file Image file
 * @returns Base64 blur placeholder
 */
export const generateBlurPlaceholder = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create tiny canvas for blur placeholder (10px width)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Set tiny dimensions
        canvas.width = 10;
        canvas.height = Math.floor((img.height / img.width) * 10);
        
        // Draw image at tiny size
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        resolve(canvas.toDataURL('image/jpeg', 0.1));
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};
