import { cn } from "@/lib/utils";

/** The one big heading at the top of a page. `as="h2"` when the page already has its h1 above. */
export function PageTitle({
  as: Tag = "h1",
  className,
  ...props
}: React.ComponentProps<"h1"> & { as?: "h1" | "h2" }) {
  return (
    <Tag className={cn("font-display text-3xl font-semibold sm:text-4xl", className)} {...props} />
  );
}
