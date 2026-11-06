import { Skeleton } from "@/components/ui/skeleton";

/** Home screen skeleton: the greeting, a row of gift pictures, a shelf of templates. The top bar stays visible. */
export default function HomeLoading() {
  return (
    <div className="flex flex-col gap-10 sm:gap-12" aria-busy="true">
      <Skeleton className="h-72 rounded-[2rem] sm:h-64" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-40" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-4 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2.5">
              <Skeleton className="aspect-[4/5] rounded-2xl" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-56" />
        <div className="flex gap-3 overflow-hidden sm:gap-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-52 shrink-0 rounded-xl sm:w-60" />
          ))}
        </div>
      </div>
    </div>
  );
}
