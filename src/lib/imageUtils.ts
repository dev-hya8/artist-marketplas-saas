const SUPABASE_BASE_URL = import.meta.env.VITE_SUPABASE_URL;
const BUCKET_NAME = 'artwork_images';

export const getSafeImageUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  
  // If the URL already contains a domain, return it directly
  if (url.startsWith('http')) {
    return url;
  }

  // Check if the Base URL is missing
  if (!SUPABASE_BASE_URL) {
    console.error("SUPABASE_BASE_URL environment variable is missing!");
    return undefined; 
  }
  
  // Construct the full URL using the storage path and optimization parameters
  // Format: [Base URL]/storage/v1/object/public/artwork_images/[filename]?width=400&format=webp&quality=80
  const baseImagePath = `${SUPABASE_BASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${url}`;
  
  // Optimization parameters for gallery thumbnails (400px width, WebP format)
  const optimizationParams = `?width=400&format=webp&quality=80`;

  return `${baseImagePath}${optimizationParams}`;
};

export const getOptimizedImageUrl = (url: string | null, width: number = 400): string | undefined => {
  const safeUrl = getSafeImageUrl(url);
  if (!safeUrl) return undefined;
  
  // Remove any existing params to get the base URL
  const baseUrl = safeUrl.split('?')[0];
  
  // Add Supabase transformation parameters
  return `${baseUrl}?width=${width}&format=webp&quality=80`;
};
