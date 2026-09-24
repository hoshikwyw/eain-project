import { ListSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function GiftsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <ListSkeleton rows={4} />
    </div>
  );
}
