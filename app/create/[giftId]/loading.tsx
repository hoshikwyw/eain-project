import { GiftSkeleton, Skeleton } from "@/components/ui/skeleton";

/** Editor skeleton: form column and preview column. */
export default function EditorLoading() {
  return (
    <main className="flex flex-1 flex-col" aria-busy="true">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 pt-2 pb-28 lg:grid-cols-[minmax(0,460px)_1fr]">
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
          </div>
          <Skeleton className="h-12" />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <div className="hidden lg:block">
          <GiftSkeleton compact />
        </div>
      </div>
    </main>
  );
}
