import { Skeleton } from "@/components/ui/skeleton";

/** Gift page skeleton: the title, then the share area, the gift and the side panels in their places. */
export default function GiftDetailLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-64 max-w-full" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-6 lg:max-w-none lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-8">
        <Skeleton className="h-80 rounded-3xl lg:col-start-2 lg:row-start-1" />
        <Skeleton className="h-[34rem] rounded-[2rem] lg:col-start-1 lg:row-span-2 lg:row-start-1" />
        <div className="flex flex-col gap-6 lg:col-start-2 lg:row-start-2">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
