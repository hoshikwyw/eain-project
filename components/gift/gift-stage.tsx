"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Width a gift is laid out at, in CSS pixels. Phone-sized on purpose: most
 * gifts are opened on a phone, where the card then shows close to its real
 * size, and larger screens scale it up.
 */
export const STAGE_WIDTH = 400;

/** The widest a gift is shown. Beyond this it stays centred. */
export const STAGE_MAX_WIDTH = 540;

/**
 * Draws its content at one fixed width and scales the whole thing to the
 * space it is given. Text wraps the same and stickers sit in the same place
 * on every screen, because every screen shows the same card, only larger or
 * smaller. Hidden until measured, so a card is never seen at the wrong size.
 */
export function GiftStage({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ scale: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const box = outer.current;
    const card = inner.current;
    if (!box || !card) return;
    const measure = () => {
      const scale = box.clientWidth / STAGE_WIDTH;
      const height = Math.round(card.offsetHeight * scale);
      if (scale > 0) setFit((prev) => (prev && prev.scale === scale && prev.height === height ? prev : { scale, height }));
    };
    // The observer reports once as soon as it starts, which is the first measure.
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={outer}
      className="mx-auto w-full overflow-hidden"
      style={{ maxWidth: STAGE_MAX_WIDTH, height: fit?.height, visibility: fit ? undefined : "hidden" }}
    >
      <div ref={inner} style={{ width: STAGE_WIDTH, transformOrigin: "top left", transform: fit ? `scale(${fit.scale})` : undefined }}>
        {children}
      </div>
    </div>
  );
}
