import { cn } from "@/lib/utils";

/**
 * Logo mark: the house with the two lovebirds, cut from the brand lockup.
 * Source: public/brand/eain-mainLogo2.png, processed by scripts/process-brand-images.mjs.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static brand asset
    <img
      src="/brand/logo-mark.webp"
      alt=""
      width={379}
      height={286}
      decoding="async"
      className={cn("h-9 w-auto select-none", className)}
      draggable={false}
    />
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
