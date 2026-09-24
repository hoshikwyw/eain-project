import { PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <PageHeaderSkeleton action={false} />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-36 rounded-2xl" />
    </div>
  );
}
