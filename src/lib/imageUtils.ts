const SUPABASE_BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
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
  
  // Construct the full optimized URL
  // Format: [Base URL]/storage/v1/object/public/artwork_images/[filename]?width=400&format=webp&quality=80
  const baseImagePath = `${SUPABASE_BASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${url}`;
  
  // Add optimization parameters for performance
  const optimizationParams = `?width=400&format=webp&quality=80`;

  return `${baseImagePath}${optimizationParams}`;
};
