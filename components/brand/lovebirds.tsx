import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Load immediately for above-the-fold placements such as the hero. */
  eager?: boolean;
};

/**
 * The Eain lovebirds mascot. Served from public/brand as a plain image and
 * not through the image optimiser, which is quota-limited on the free plan.
 * Source: public/brand/couple.png, processed by scripts/process-brand-images.mjs.
 */
export function Lovebirds({ className, eager }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static brand asset, optimiser bypassed on purpose
    <img
      src="/brand/lovebirds.webp"
      alt=""
      width={1096}
      height={929}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={cn("float-slow h-auto w-full select-none", className)}
      draggable={false}
    />
  );
}

/** Single birds for accents: success states, empty states, 404. */
export function Bird({ variant, className }: { variant: "pink" | "blue"; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static brand asset
    <img
      src={`/brand/bird-${variant}.webp`}
      alt=""
      width={600}
      height={variant === "pink" ? 755 : 734}
      loading="lazy"
      decoding="async"
      className={cn("h-auto w-full select-none", className)}
      draggable={false}
    />
  );
}
