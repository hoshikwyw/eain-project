import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <main className="bg-hero flex flex-1 flex-col" aria-busy="true">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:items-center">
        <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <Skeleton className="mx-auto h-8 w-40" />
          <Skeleton className="mx-auto h-4 w-56" />
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
        </div>
      </div>
    </main>
  );
}
