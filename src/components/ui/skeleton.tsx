/**
 * Loading skeleton component for use in text areas, cards, etc.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800 ${className}`}
    />
  );
}

export function TextInputSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="flex-1 min-h-[300px] rounded-xl" />
      <Skeleton className="mt-2 h-1 rounded-full" />
    </div>
  );
}

export function ResultSkeleton() {
  return (
    <div className="flex flex-col h-full items-center justify-center min-h-[300px]">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
    </div>
  );
}
