import { GiftSkeleton, Skeleton } from "@/components/ui/skeleton";

/** Editor skeleton: its bar across the top, the gift, and the tool panel beside it. */
export function EditorSkeleton() {
  return (
    <main className="flex flex-1 flex-col" aria-busy="true">
      <div className="flex flex-col border-b border-border/50 px-[max(1rem,calc(50%-35rem))]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2 lg:h-16 lg:flex-nowrap lg:py-0">
          <div className="flex basis-full items-center gap-2 lg:basis-auto">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <div className="flex flex-1 items-center justify-end gap-2">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        </div>
        <div className="min-h-12" />
      </div>
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 pt-4 pb-28 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="mx-auto w-full max-w-[540px]">
          <GiftSkeleton />
        </div>
        <div className="hidden flex-col gap-3 lg:flex">
          <Skeleton className="h-14 rounded-2xl" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
