import { Skeleton } from "@/components/ui/skeleton";

/** Inbox skeleton: the title and one panel of rows. */
export default function NotificationsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-56 max-w-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex flex-col gap-1 rounded-3xl glass border p-1.5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3.5 px-3 py-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
