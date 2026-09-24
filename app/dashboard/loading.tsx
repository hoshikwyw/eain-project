import { PageHeaderSkeleton, Skeleton, StatTilesSkeleton } from "@/components/ui/skeleton";

/** Dashboard home skeleton. Layout chrome stays visible. */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <PageHeaderSkeleton />
      <StatTilesSkeleton />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <Skeleton className="size-11 shrink-0" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
