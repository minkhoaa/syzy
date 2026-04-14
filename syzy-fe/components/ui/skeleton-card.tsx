import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn(
      "rounded-2xl bg-gradient-to-br from-surface-1 to-surface-2 border border-border/50 p-4 space-y-4 overflow-hidden relative animate-skeleton-pulse",
      className
    )}>
      {/* Shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

      <div className="flex gap-4">
        <div className="w-14 h-14 rounded-full bg-muted/50 animate-skeleton-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 bg-muted/50 rounded animate-skeleton-pulse" />
          <div className="h-4 w-full bg-muted/50 rounded animate-skeleton-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="h-14 bg-muted/50 rounded-lg animate-skeleton-pulse" />
        <div className="h-14 bg-muted/50 rounded-lg animate-skeleton-pulse" />
      </div>
    </div>
  );
}
