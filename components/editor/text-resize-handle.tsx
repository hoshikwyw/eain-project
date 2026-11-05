"use client";

import { useState, type RefObject } from "react";
import { trackPointer, useCanvasBox } from "./canvas-geometry";

/** Limits of features/gifts/schemas.ts textStyleSchema.scale. */
const MIN = 0.5;
const MAX = 2.5;

type Props = {
  canvas: RefObject<HTMLElement | null>;
  /** The text being edited. */
  selector: string;
  /** Anything that changes when the canvas layout may have. */
  watch: unknown;
  scale: number;
  onScale: (scale: number) => void;
  label: string;
};

/**
 * A dot at the corner of the text being edited. Pulling it away from the
 * text makes the text bigger, pushing it in makes it smaller. It never takes
 * focus, so the text stays in edit while it is resized.
 */
export function TextResizeHandle({ canvas, selector, watch, scale, onScale, label }: Props) {
  const box = useCanvasBox(canvas, selector, watch);
  const [dragging, setDragging] = useState(false);
  if (!box) return null;

  const begin = (e: React.PointerEvent) => {
    const outer = canvas.current?.getBoundingClientRect();
    if (!outer) return;
    e.preventDefault();
    e.stopPropagation();
    // Size follows the pointer's distance from the text's top-left corner.
    const origin = { x: outer.left + box.left, y: outer.top + box.top };
    const startDistance = Math.max(Math.hypot(e.clientX - origin.x, e.clientY - origin.y), 12);
    const startScale = scale;
    setDragging(true);
    trackPointer(
      (ev) => {
        const distance = Math.hypot(ev.clientX - origin.x, ev.clientY - origin.y);
        const next = Math.round(((startScale * distance) / startDistance) * 20) / 20;
        onScale(Math.min(Math.max(next, MIN), MAX));
      },
      () => setDragging(false),
    );
  };

  const left = box.left + box.width + 4;
  const top = box.top + box.height + 4;
  return (
    <>
      <span
        data-canvas-ui=""
        title={label}
        className="absolute z-20 size-4 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize touch-none rounded-full border-2 border-white bg-[var(--canvas-mark)] shadow-md before:absolute before:-inset-2.5 before:content-['']"
        style={{ left, top }}
        onPointerDown={begin}
        onMouseDown={(e) => e.preventDefault()}
      />
      {dragging && (
        <span
          data-canvas-ui=""
          className="pointer-events-none absolute z-20 rounded-full bg-[var(--canvas-mark)] px-2 py-0.5 text-xs font-semibold text-white shadow"
          style={{ left: left + 12, top: top + 8 }}
        >
          {Math.round(scale * 100)}%
        </span>
      )}
    </>
  );
}
