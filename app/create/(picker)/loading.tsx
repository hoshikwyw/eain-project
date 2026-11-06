import { CardGridSkeleton, Skeleton } from "@/components/ui/skeleton";

/** Template picker skeleton: the title, the search box, the category chips, the cards. The frame stays visible. */
export default function CreateLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="flex flex-col gap-5">
        <Skeleton className="h-12 w-full rounded-full" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
          ))}
        </div>
        <CardGridSkeleton count={6} />
      </div>
    </div>
  );
}
