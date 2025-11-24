// src/lib/imageUtils.ts (REPLACE EVERYTHING IN THIS FILE)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const BUCKET_NAME = 'artwork_images';

// Function to safely construct a full image URL
export const getSafeImageUrl = (url: string | null | undefined): string | undefined => {
  // 1. If the input URL is null or undefined, return nothing
  if (!url) return undefined;

  // 2. If the URL already starts with http, it's complete, so use it
  if (url.startsWith('http')) {
    return url;
  }

  // 3. If the Supabase URL is missing from environment, throw an error for debug
  if (!SUPABASE_URL) {
    console.error("Environment variable NEXT_PUBLIC_SUPABASE_URL is missing!");
    return undefined; 
  }
  
  // 4. If we only have the filename, construct the full path
  // Format: [Supabase URL]/storage/v1/object/public/[BUCKET_NAME]/[filename]
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${url}`;
};
