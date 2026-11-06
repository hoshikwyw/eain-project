import { Bird, Lovebirds } from "@/components/brand/lovebirds";
import { cn } from "@/lib/utils";

type Props = {
  /** Which mascot keeps the empty place company. "pair" is for a whole empty page. */
  bird?: "pink" | "blue" | "pair";
  title?: string;
  text: string;
  /** A button or link under the text. */
  children?: React.ReactNode;
  /** Smaller, for an empty part of a page that is otherwise full. */
  compact?: boolean;
  className?: string;
};

/**
 * What a list shows when it has nothing in it: a bird, a sentence, and
 * usually one thing to do about it. One look for every empty place.
 */
export function EmptyState({ bird = "pink", title, text, children, compact, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-3xl border border-dashed border-border px-6 text-center",
        compact ? "gap-3 py-8" : "gap-4 py-10 sm:py-12",
        className,
      )}
    >
      {bird === "pair" ? (
        <div className="w-full max-w-52">
          <Lovebirds />
        </div>
      ) : (
        <Bird variant={bird} className={compact ? "w-14" : "w-20"} />
      )}
      <div>
        {title && <p className="font-display text-lg font-semibold">{title}</p>}
        <p className={cn("mx-auto max-w-sm text-sm text-muted-foreground", title && "mt-1")}>
          {text}
        </p>
      </div>
      {children}
    </div>
  );
}
