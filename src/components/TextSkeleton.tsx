import { cn } from "@/lib/utils";

interface TextSkeletonProps {
  lines?: number;
  className?: string;
}

export const TextSkeleton = ({ lines = 4, className }: TextSkeletonProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className="h-5 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer rounded"
          style={{
            width: i === lines - 1 ? '75%' : '100%',
            backgroundSize: '1000px 100%',
          }}
        />
      ))}
    </div>
  );
};
