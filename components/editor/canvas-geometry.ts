import { useLayoutEffect, useState, type RefObject } from "react";
import type { Section, Sticker } from "@/features/gifts/schemas";

/** A text on the gift: its section, field and, for timelines, item. */
export type TextTarget = { sectionId: string; field: string; index?: number };

const quote = (value: string) => value.replace(/["\\]/g, "\\$&");

/** CSS selector for a section on the canvas. */
export const sectionSelector = (id: string) => `[data-section-id="${quote(id)}"]`;

/** CSS selector for one editable text on the canvas. */
export const textSelector = (t: TextTarget) =>
  `${sectionSelector(t.sectionId)} [data-text-field="${quote(t.field)}"]${t.index === undefined ? "" : `[data-text-index="${t.index}"]`}`;

/** An element's box in pixels from the canvas's top-left corner, with the canvas size. */
export type Box = { left: number; top: number; width: number; height: number; canvasWidth: number; canvasHeight: number };

/**
 * Where an element sits inside the canvas. `selector` null measures the
 * canvas itself; undefined measures nothing. Measured again when the canvas
 * or the element resizes and when `watch` changes, since editing one section
 * moves everything below it.
 */
export function useCanvasBox(canvas: RefObject<HTMLElement | null>, selector: string | null | undefined, watch: unknown): Box | null {
  const key = selector === undefined ? undefined : (selector ?? "");
  const [measured, setMeasured] = useState<{ key: string; box: Box } | null>(null);

  useLayoutEffect(() => {
    const outer = canvas.current;
    if (!outer || key === undefined) return;
    const el = key === "" ? outer : outer.querySelector<HTMLElement>(key);
    if (!el) return;
    const measure = () => {
      const o = outer.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const box: Box = {
        left: Math.round(r.left - o.left),
        top: Math.round(r.top - o.top),
        width: Math.round(r.width),
        height: Math.round(r.height),
        canvasWidth: Math.round(o.width),
        canvasHeight: Math.round(o.height),
      };
      setMeasured((prev) =>
        prev && prev.key === key && (Object.keys(box) as (keyof Box)[]).every((k) => prev.box[k] === box[k]) ? prev : { key, box },
      );
    };
    // The observer reports once as soon as it starts, which is the first measure.
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    if (el !== outer) observer.observe(el);
    return () => observer.disconnect();
  }, [canvas, key, watch]);

  return measured && measured.key === key ? measured.box : null;
}

// Stickers ---------------------------------------------------------------------

/** A sticker on screen: its centre and width in viewport pixels. */
export type Placed = { cx: number; cy: number; size: number };

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
const percent = (part: number, whole: number) => Math.round((part / whole) * 10000) / 100;

/** The box a sticker is positioned in: its section, or the whole gift. */
export function stickerContainer(canvas: HTMLElement, sections: Section[], sticker: Sticker): Element | null {
  if (sticker.anchor === undefined) return canvas;
  const id = sections[sticker.anchor]?.id;
  return id ? canvas.querySelector(sectionSelector(id)) : null;
}

/** Selector of the box a sticker is positioned in. Null: the whole gift. Undefined: its section is gone. */
export function stickerContainerSelector(sections: Section[], sticker: Sticker): string | null | undefined {
  if (sticker.anchor === undefined) return null;
  const id = sections[sticker.anchor]?.id;
  return id ? sectionSelector(id) : undefined;
}

/** Where a sticker is on screen right now. */
export function stickerOnScreen(canvas: HTMLElement, sections: Section[], sticker: Sticker): Placed | null {
  const box = stickerContainer(canvas, sections, sticker)?.getBoundingClientRect();
  if (!box || box.width === 0) return null;
  return {
    cx: box.left + (sticker.x / 100) * box.width,
    cy: box.top + (sticker.y / 100) * box.height,
    size: (sticker.size / 100) * box.width,
  };
}

/**
 * The sticker for a spot on screen. It lands on the section under its
 * centre, so it stays beside that section's text on every screen size, or on
 * the gift itself when it is over a frame or margin. Question sections are
 * skipped, since the receiver answers them in a form and never sees them here.
 */
export function stickerAt(canvas: HTMLElement, sections: Section[], base: Pick<Sticker, "id" | "kind" | "rotate">, spot: Placed): Sticker {
  const frame = canvas.getBoundingClientRect();
  const size = clamp(spot.size, frame.width * 0.04, frame.width * 0.6);
  const cx = clamp(spot.cx, frame.left, frame.right);
  const cy = clamp(spot.cy, frame.top, frame.bottom);
  const { id, kind, rotate } = base;

  for (const [index, section] of sections.entries()) {
    if (section.type === "question") continue;
    const r = canvas.querySelector(sectionSelector(section.id))?.getBoundingClientRect();
    if (r && r.width > 0 && r.height > 0 && cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
      return { id, kind, rotate, anchor: index, x: percent(cx - r.left, r.width), y: percent(cy - r.top, r.height), size: percent(size, r.width) };
    }
  }
  return { id, kind, rotate, x: percent(cx - frame.left, frame.width), y: percent(cy - frame.top, frame.height), size: percent(size, frame.width) };
}

/**
 * Runs `onMove` for every pointer move until the pointer lifts, then `onEnd`.
 * Listens on the window, so the drag carries on outside the element it began on.
 */
export function trackPointer(onMove: (e: PointerEvent) => void, onEnd?: () => void) {
  const stop = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", stop);
    window.removeEventListener("pointercancel", stop);
    onEnd?.();
  };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", stop);
  window.addEventListener("pointercancel", stop);
}
