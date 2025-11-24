import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface ImageWithDarkModeProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  applyDarkFilter?: boolean;
}

/**
 * Image component that applies subtle filter in dark mode
 * to help images blend better with dark background
 */
export const ImageWithDarkMode = ({ 
  applyDarkFilter = true, 
  className,
  ...props 
}: ImageWithDarkModeProps) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <img
      {...props}
      className={cn(
        className,
        applyDarkFilter && isDark && "brightness-90 contrast-90"
      )}
    />
  );
};
