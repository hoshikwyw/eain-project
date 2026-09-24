import { GiftSkeleton, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function GiftDetailLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <PageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
            <Skeleton className="h-5 w-24" />
            <div className="grid gap-6 md:grid-cols-[1fr_auto]">
              <div className="flex flex-col gap-3">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
              <Skeleton className="size-44 rounded-2xl" />
            </div>
          </div>
          <GiftSkeleton compact />
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
