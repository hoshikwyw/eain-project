import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"p"> & {
  /** "success" for good news that something worked; "info" for everything else, errors included. */
  tone?: "info" | "success";
};

/**
 * A one-line message above or inside a form: something was saved, something
 * failed, something to know. Pass `role="alert"` for a failure and
 * `role="status"` for news, so screen readers announce it the right way.
 */
export function Notice({ tone = "info", className, ...props }: Props) {
  return (
    <p
      className={cn(
        "rounded-xl px-3.5 py-2.5 text-sm",
        tone === "success" ? "bg-success-soft text-success" : "bg-accent text-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}
