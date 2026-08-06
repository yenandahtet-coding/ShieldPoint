import { cn } from "@/lib/utils";

export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted/60",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.6s_infinite]",
        "after:bg-linear-to-r after:from-transparent after:via-foreground/10 after:to-transparent",
        className,
      )}
    />
  );
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-5">
          <Shimmer className="h-3 w-24" />
          <Shimmer className="mt-4 h-8 w-32" />
          <Shimmer className="mt-3 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Shimmer key={i} className="h-11 w-full" />
      ))}
    </div>
  );
}
