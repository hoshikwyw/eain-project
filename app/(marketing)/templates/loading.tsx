import { CardGridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function TemplatesLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12" aria-busy="true">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <Skeleton className="h-11 w-full" />
      <CardGridSkeleton count={6} />
    </div>
  );
}
