"use client";

import { ChevronDown, ChevronUp, Copy, SlidersHorizontal, Trash2 } from "lucide-react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { sectionSelector, useCanvasBox } from "./canvas-geometry";

type Props = {
  canvas: RefObject<HTMLElement | null>;
  sectionId: string;
  /** Anything that changes when the canvas layout may have. */
  watch: unknown;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canRemove: boolean;
  canDuplicate: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  labels: { moveUp: string; moveDown: string; edit: string; duplicate: string; remove: string };
};

/**
 * Floating actions for the selected section. It sits over the canvas and
 * not inside the gift, so no design can clip or restyle it.
 */
export function SectionToolbar({ canvas, sectionId, watch, labels, ...p }: Props) {
  const box = useCanvasBox(canvas, sectionSelector(sectionId), watch);
  if (!box) return null;
  return (
    <div
      data-canvas-ui=""
      className="absolute z-20 flex items-center gap-0.5 rounded-full border glass-strong p-1 text-foreground shadow-lg"
      style={{ top: box.top - 50, right: Math.max(box.canvasWidth - box.left - box.width - 4, 0) }}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label={labels.moveUp}
        disabled={!p.canMoveUp}
        onClick={p.onMoveUp}
      >
        <ChevronUp />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label={labels.moveDown}
        disabled={!p.canMoveDown}
        onClick={p.onMoveDown}
      >
        <ChevronDown />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label={labels.edit}
        onClick={p.onEdit}
      >
        <SlidersHorizontal />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label={labels.duplicate}
        disabled={!p.canDuplicate}
        onClick={p.onDuplicate}
      >
        <Copy />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 text-destructive"
        aria-label={labels.remove}
        disabled={!p.canRemove}
        onClick={p.onRemove}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
