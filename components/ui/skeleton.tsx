import { cn } from "@/lib/utils";

/** Grey placeholder block that pulses while content loads. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-xl bg-muted", className)} {...props} />;
}

/** A row of stat tiles. */
export function StatTilesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-20 rounded-2xl" />
      ))}
    </div>
  );
}

/** Title and subtitle placeholders in the page header position. */
export function PageHeaderSkeleton({ action = true }: { action?: boolean }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      {action && <Skeleton className="h-11 w-40" />}
    </div>
  );
}

/** List of card rows with an avatar square, two lines and a chip. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="flex flex-col gap-3" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <Skeleton className="size-14 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

/** Template card grid. */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
          <Skeleton className="aspect-[4/3]" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
    </div>
  );
}

/** A gift preview card shape. */
export function GiftSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-5 rounded-3xl border border-border bg-card", compact ? "p-6" : "p-8 sm:p-12")} aria-busy="true">
      <Skeleton className="h-3 w-24" />
      <Skeleton className={compact ? "h-9 w-3/4" : "h-12 w-3/4"} />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mx-auto aspect-[3/2] w-2/3" />
    </div>
  );
}
