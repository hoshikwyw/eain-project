import { CardGridSkeleton, Skeleton } from "@/components/ui/skeleton";

/** Template picker skeleton, matching the header row and grid of the real page. */
export default function CreateLoading() {
  return (
    <main className="flex flex-1 flex-col" aria-busy="true">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-4 pb-28">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-11 w-full" />
        <div className="flex gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <CardGridSkeleton count={6} />
      </div>
    </main>
  );
}
