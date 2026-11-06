"use client";

import { useState, type RefObject } from "react";
import { PHOTO_SIZE_MAX, PHOTO_SIZE_MIN } from "@/features/gifts/schemas";
import { sectionSelector, trackPointer, useCanvasBox } from "./canvas-geometry";

/** CSS selector for the photo (or photo grid) of a section on the canvas. */
export const photoSelector = (sectionId: string) => `${sectionSelector(sectionId)} [data-photo]`;

type Props = {
  canvas: RefObject<HTMLElement | null>;
  /** The section whose photo is resized. */
  sectionId: string;
  /** Anything that changes when the canvas layout may have. */
  watch: unknown;
  /** The photo's width, in percent of the section's width. */
  size: number;
  onSize: (size: number) => void;
  /** The drag has ended. The click that the browser sends right after it must not clear the selection. */
  onDone?: () => void;
  label: string;
};

/**
 * A dot at the corner of a selected photo. Pulling it outwards makes the
 * photo wider, pushing it in makes it narrower. The photo stays centred, so
 * its width is twice the pointer's distance from the middle of the section.
 * Nothing is drawn while the section has no photo yet.
 */
export function PhotoResizeHandle({
  canvas,
  sectionId,
  watch,
  size,
  onSize,
  onDone,
  label,
}: Props) {
  const box = useCanvasBox(canvas, photoSelector(sectionId), watch);
  const [dragging, setDragging] = useState(false);
  if (!box) return null;

  const begin = (e: React.PointerEvent) => {
    const section = canvas.current
      ?.querySelector(sectionSelector(sectionId))
      ?.getBoundingClientRect();
    if (!section || section.width === 0) return;
    e.preventDefault();
    e.stopPropagation();
    const middle = section.left + section.width / 2;
    setDragging(true);
    trackPointer(
      (ev) => {
        // Signed on purpose: pulled past the middle, the photo stops at its smallest and does not grow again.
        const next = Math.round(((2 * (ev.clientX - middle)) / section.width) * 100);
        onSize(Math.min(Math.max(next, PHOTO_SIZE_MIN), PHOTO_SIZE_MAX));
      },
      () => {
        setDragging(false);
        onDone?.();
      },
    );
  };

  const left = box.left + box.width;
  const top = box.top + box.height;
  return (
    <>
      <span
        data-canvas-ui=""
        title={label}
        className="absolute z-20 size-5 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize touch-none rounded-full border-2 border-white bg-[var(--canvas-mark)] shadow-md before:absolute before:-inset-2.5 before:content-['']"
        style={{ left, top }}
        onPointerDown={begin}
        onMouseDown={(e) => e.preventDefault()}
      />
      {dragging && (
        <span
          data-canvas-ui=""
          className="pointer-events-none absolute z-20 -translate-x-full rounded-full bg-[var(--canvas-mark)] px-2 py-0.5 text-xs font-semibold text-white shadow"
          style={{ left: left - 14, top: top + 10 }}
        >
          {size}%
        </span>
      )}
    </>
  );
}
