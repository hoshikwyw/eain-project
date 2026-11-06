import { Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  balance: number;
  /** What the number is, for screen readers: the word "Points" in the reader's language. */
  label: string;
  /** "brand": pink, for bars and page headers. "plain": pale, for sitting on a coloured card. */
  tone?: "brand" | "plain";
  className?: string;
};

/** The points balance as a small pill with a star. Pressing it opens the points page. */
export function PointsPill({ balance, label, tone = "brand", className }: Props) {
  return (
    <Link
      href="/dashboard/points"
      aria-label={`${label}: ${balance}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full text-sm font-bold transition",
        tone === "brand"
          ? "h-9 bg-brand-soft px-3.5 text-accent-foreground hover:brightness-95 dark:text-brand dark:hover:brightness-110"
          : "h-8 bg-background/70 px-3 hover:bg-background",
        className,
      )}
    >
      <Star className={cn("size-4 fill-current", tone === "plain" && "text-brand")} />
      {balance}
    </Link>
  );
}
