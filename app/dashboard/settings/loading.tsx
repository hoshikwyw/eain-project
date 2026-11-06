import { Skeleton } from "@/components/ui/skeleton";

/** Settings skeleton: the title, the profile card, then the groups. */
export default function SettingsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6" aria-busy="true">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-32 rounded-4xl" />
      <Skeleton className="h-32 rounded-3xl" />
      <Skeleton className="h-28 rounded-3xl" />
      <Skeleton className="h-28 rounded-3xl" />
      <Skeleton className="h-28 rounded-3xl" />
    </div>
  );
}
