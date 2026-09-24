import { ListSkeleton, PageHeaderSkeleton, StatTilesSkeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton action={false} />
      <StatTilesSkeleton count={4} />
      <ListSkeleton rows={3} />
    </div>
  );
}
