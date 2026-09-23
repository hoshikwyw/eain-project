import { cn } from "@/lib/utils";

type LogoMarkProps = React.ComponentProps<"svg">;

/**
 * Placeholder mark: a house with a heart window and two lovebirds.
 * Uses theme tokens so it adapts to light and dark.
 * Replaced by the final illustration in the polish milestone.
 */
export function LogoMark({ className, ...props }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn("size-8", className)}
      {...props}
    >
      <path
        d="M32 8 8 28v26a4 4 0 0 0 4 4h40a4 4 0 0 0 4-4V28L32 8Z"
        fill="var(--brand-soft)"
        stroke="var(--brand)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M32 33c-2.4-4.6-9-3.6-9 1.4 0 3.8 5.8 7.2 9 9.6 3.2-2.4 9-5.8 9-9.6 0-5-6.6-6-9-1.4Z"
        fill="var(--brand)"
      />
      <ellipse cx="22" cy="52" rx="6" ry="4.5" fill="var(--bird-a)" />
      <circle cx="17" cy="49" r="3" fill="var(--bird-a)" />
      <ellipse cx="42" cy="52" rx="6" ry="4.5" fill="var(--bird-b)" />
      <circle cx="47" cy="49" r="3" fill="var(--bird-b)" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-2xl font-semibold tracking-tight", className)}>
      Ea<span className="relative">
        i<span aria-hidden="true" className="absolute -top-1 left-1/2 -translate-x-1/2 text-[0.45em] text-brand">
          ♥
        </span>
      </span>
      n
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <Wordmark />
    </span>
  );
}
