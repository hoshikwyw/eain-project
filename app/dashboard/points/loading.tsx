import { PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function PointsLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <PageHeaderSkeleton action={false} />
      <Skeleton className="h-28 rounded-2xl" />
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-3 py-2">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
