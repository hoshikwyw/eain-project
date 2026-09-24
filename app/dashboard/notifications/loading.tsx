import { ListSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <ListSkeleton rows={5} />
    </div>
  );
}
