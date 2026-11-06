import { Skeleton } from "@/components/ui/skeleton";

/** My Gifts skeleton: the title, the filter tabs, a grid of gift pictures. */
export default function GiftsLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-11 w-72 max-w-full rounded-full" />
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2.5">
            <Skeleton className="aspect-[4/5] rounded-2xl" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-9 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
