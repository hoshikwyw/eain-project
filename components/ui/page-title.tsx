import { cn } from "@/lib/utils";

/** The one big heading at the top of a page. */
export function PageTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return <h1 className={cn("font-display text-3xl font-semibold sm:text-4xl", className)} {...props} />;
}
