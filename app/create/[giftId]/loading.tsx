import { GiftSkeleton, Skeleton } from "@/components/ui/skeleton";

/** Editor skeleton: action bar, the gift, and the tool panel beside it. */
export default function EditorLoading() {
  return (
    <main className="flex flex-1 flex-col" aria-busy="true">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-2 pb-28">
        <div className="flex items-center justify-end gap-2 py-2.5">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="mx-auto w-full max-w-2xl">
            <GiftSkeleton />
          </div>
          <div className="hidden flex-col gap-3 lg:flex">
            <Skeleton className="h-14" />
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
