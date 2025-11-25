import { useState } from "react";
import { cn } from "@/lib/utils";
import { getOptimizedImageUrl, getSafeImageUrl } from "@/lib/imageUtils";

interface OptimizedImageProps {
  src: string | null;
  alt: string;
  className?: string;
  thumbnailWidth?: number;
  priority?: boolean;
}

/**
 * Optimized image component with automatic fallback to raw URL
 * Strategy:
 * 1. Attempt optimized URL (with transformation params)
 * 2. On error, fall back to raw URL (no params)
 * 3. Only show error state if both fail
 */
export const OptimizedImage = ({
  src,
  alt,
  className,
  thumbnailWidth = 400,
  priority = false,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(() => 
    getOptimizedImageUrl(src, thumbnailWidth)
  );
  const [hasFallbackFailed, setHasFallbackFailed] = useState(false);

  const optimizedSrc = getOptimizedImageUrl(src, thumbnailWidth);
  const rawSrc = getSafeImageUrl(src);

  // Handle image load error with fallback logic
  const handleError = () => {
    console.warn(`Image transformation failed for: ${currentUrl}`);
    
    // If we're currently using the optimized URL, fall back to raw
    if (currentUrl === optimizedSrc && rawSrc && rawSrc !== optimizedSrc) {
      console.log(`Falling back to raw URL: ${rawSrc}`);
      setCurrentUrl(rawSrc);
      setIsLoaded(false); // Reset loading state for retry
    } else {
      // Both optimized and raw failed
      console.error(`All image URL attempts failed for: ${src}`);
      setHasFallbackFailed(true);
    }
  };

  if (!currentUrl || hasFallbackFailed) {
    return (
      <div className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}>
        No image
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Blur placeholder - shown while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Actual image with fallback mechanism */}
      <img
        src={currentUrl}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setIsLoaded(true)}
        onError={handleError}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
};
