import { Skeleton } from "@/components/ui/skeleton";

/** Points skeleton: the title, the wallet, three ways to earn, the history. */
export default function PointsLoading() {
  return (
    <div className="flex flex-col gap-8 sm:gap-10" aria-busy="true">
      <Skeleton className="h-10 w-64 max-w-full" />
      <Skeleton className="h-72 rounded-4xl" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-40" />
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl sm:h-24" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    </div>
  );
}
