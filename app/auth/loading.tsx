import { Skeleton } from "@/components/ui/skeleton";
import { appMode } from "@/lib/app-mode";
import { cn } from "@/lib/utils";

/** Sign-in skeleton in the same frame as the real screens: the picture side on wide screens, the form side with its fields. */
export default function AuthLoading() {
  const branded = appMode !== "admin";
  return (
    <main className="bg-hero flex flex-1 flex-col lg:flex-row" aria-busy="true">
      {branded && (
        <div className="hidden flex-1 flex-col items-center justify-center gap-8 p-12 lg:flex">
          <Skeleton className="size-64 rounded-full bg-background/40" />
          <Skeleton className="h-10 w-80 bg-background/40" />
          <Skeleton className="h-5 w-64 bg-background/40" />
        </div>
      )}
      <div className={cn("flex flex-1 flex-col", branded && "lg:rounded-l-[2.5rem] lg:bg-background/80")}>
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 lg:px-8">
          <Skeleton className={cn("h-9 w-28", branded && "lg:invisible")} />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="flex flex-1 items-start justify-center px-4 pt-2 pb-16 sm:items-center">
          <div
            className={cn(
              "flex w-full max-w-md flex-col gap-4 rounded-3xl glass border p-6 sm:p-8",
              branded && "lg:border-0 lg:bg-transparent lg:p-0",
            )}
          >
            <Skeleton className={cn("mx-auto h-9 w-48", branded && "lg:mx-0")} />
            <Skeleton className={cn("mx-auto h-4 w-64 max-w-full", branded && "lg:mx-0")} />
            <Skeleton className="mt-2 h-11" />
            <Skeleton className="h-11" />
            <Skeleton className="h-11 rounded-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
