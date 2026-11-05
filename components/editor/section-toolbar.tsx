"use client";

import { ChevronDown, ChevronUp, SlidersHorizontal, Trash2 } from "lucide-react";
import { useLayoutEffect, useState, type RefObject } from "react";
import { Button } from "@/components/ui/button";

type Box = { top: number; right: number };

/** CSS selector for a section on the canvas. */
export const sectionSelector = (id: string) => `[data-section-id="${id.replace(/["\\]/g, "\\$&")}"]`;

/**
 * Where the element matching `selector` sits inside `container`: its top
 * edge and the gap to the container's right edge. Measured again when either
 * resizes or `watch` changes, since editing one section moves the ones below.
 */
function useBox(container: RefObject<HTMLElement | null>, selector: string | null, watch: unknown): Box | null {
  const [measured, setMeasured] = useState<{ selector: string; box: Box } | null>(null);

  useLayoutEffect(() => {
    const outer = container.current;
    const el = selector && outer ? outer.querySelector<HTMLElement>(selector) : null;
    if (!outer || !el || !selector) return;
    const measure = () => {
      const o = outer.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const box = { top: Math.round(r.top - o.top), right: Math.round(o.right - r.right) };
      setMeasured((prev) =>
        prev && prev.selector === selector && prev.box.top === box.top && prev.box.right === box.right ? prev : { selector, box },
      );
    };
    // The observer reports once as soon as it starts, which is the first measure.
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(el);
    return () => observer.disconnect();
  }, [container, selector, watch]);

  return measured && measured.selector === selector ? measured.box : null;
}

type Props = {
  canvas: RefObject<HTMLElement | null>;
  sectionId: string;
  /** Anything that changes when the canvas layout may have. */
  watch: unknown;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canRemove: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onRemove: () => void;
  labels: { moveUp: string; moveDown: string; edit: string; remove: string };
};

/**
 * Floating actions for the selected section. It sits over the canvas and
 * not inside the gift, so no design can clip or restyle it.
 */
export function SectionToolbar({ canvas, sectionId, watch, labels, ...p }: Props) {
  const box = useBox(canvas, sectionSelector(sectionId), watch);
  if (!box) return null;
  return (
    <div
      data-canvas-ui=""
      className="absolute z-20 flex items-center gap-0.5 rounded-full border border-border bg-card p-1 text-foreground shadow-lg"
      style={{ top: box.top - 50, right: Math.max(box.right - 4, 0) }}
    >
      <Button type="button" variant="ghost" size="icon" className="size-8" aria-label={labels.moveUp} disabled={!p.canMoveUp} onClick={p.onMoveUp}>
        <ChevronUp />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="size-8" aria-label={labels.moveDown} disabled={!p.canMoveDown} onClick={p.onMoveDown}>
        <ChevronDown />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="size-8" aria-label={labels.edit} onClick={p.onEdit}>
        <SlidersHorizontal />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="size-8 text-destructive" aria-label={labels.remove} disabled={!p.canRemove} onClick={p.onRemove}>
        <Trash2 />
      </Button>
    </div>
  );
}
