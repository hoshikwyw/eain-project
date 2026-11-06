import { cn } from "@/lib/utils";

type Props = {
  /** The element to draw: a heading when it names a group, a paragraph otherwise. */
  as?: "h2" | "h3" | "p" | "span";
  id?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * A small label in capitals above a group of things. Burmese has no
 * capitals and reads badly when spaced out, so there it is plain small text.
 */
export function CapsLabel({ as: Tag = "p", id, className, children }: Props) {
  return (
    <Tag
      id={id}
      className={cn(
        "text-xs font-semibold tracking-wide text-muted-foreground uppercase my:tracking-normal my:normal-case",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
