"use client";

import { BringToFront, Copy, RotateCw, Trash2 } from "lucide-react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import type { Sticker } from "@/features/gifts/schemas";
import { trackPointer, useCanvasBox } from "./canvas-geometry";

type Props = {
  canvas: RefObject<HTMLElement | null>;
  sticker: Sticker;
  /** Box the sticker is positioned in. Null: the whole gift. */
  container: string | null;
  /** Anything that changes when the canvas layout may have. */
  watch: unknown;
  onChange: (patch: Partial<Pick<Sticker, "size" | "rotate">>) => void;
  canDuplicate: boolean;
  onDuplicate: () => void;
  onFront: () => void;
  onRemove: () => void;
  labels: { resize: string; rotate: string; duplicate: string; front: string; remove: string };
};

const CORNERS = [
  "top-0 left-0 cursor-nwse-resize",
  "top-0 left-full cursor-nesw-resize",
  "top-full left-0 cursor-nesw-resize",
  "top-full left-full cursor-nwse-resize",
];

const handleClass =
  "pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 touch-none border-2 border-[var(--canvas-mark)] bg-white shadow before:absolute before:-inset-2.5 before:content-['']";

/**
 * Frame and handles for the selected sticker: pull a corner to resize, turn
 * the round handle to rotate. The frame lets clicks through, so the sticker
 * under it is still dragged directly.
 */
export function StickerControls({
  canvas,
  sticker,
  container,
  watch,
  onChange,
  labels,
  ...p
}: Props) {
  const box = useCanvasBox(canvas, container, watch);
  if (!box) return null;

  const cx = box.left + (sticker.x / 100) * box.width;
  const cy = box.top + (sticker.y / 100) * box.height;
  const size = (sticker.size / 100) * box.width;

  const begin = (e: React.PointerEvent, action: "resize" | "rotate") => {
    const outer = canvas.current?.getBoundingClientRect();
    if (!outer) return;
    e.preventDefault();
    e.stopPropagation();
    const centre = { x: outer.left + cx, y: outer.top + cy };
    trackPointer((ev) => {
      const dx = ev.clientX - centre.x;
      const dy = ev.clientY - centre.y;
      if (action === "resize") {
        // A corner sits half a diagonal from the centre, whatever the rotation.
        const width = Math.min(
          Math.max(Math.hypot(dx, dy) * Math.SQRT2, box.canvasWidth * 0.04),
          box.canvasWidth * 0.6,
        );
        onChange({ size: Math.round((width / box.width) * 10000) / 100 });
      } else {
        // The handle hangs below the sticker, so straight down is no rotation.
        const deg = (((Math.atan2(dy, dx) * 180) / Math.PI - 90 + 540) % 360) - 180;
        const snapped = Math.round(deg / 45) * 45;
        const next = Math.abs(deg - snapped) < 4 ? snapped : Math.round(deg);
        onChange({ rotate: next === -180 ? 180 : next });
      }
    });
  };

  // The toolbar stays level, clear of the sticker's widest reach: above it,
  // or below it when the sticker is too near the top of the gift for that.
  const reach = (size * Math.SQRT2) / 2;
  const above = cy - reach - 52;
  const toolbarTop = above >= 0 ? above : cy + reach + 48;
  return (
    <>
      <div
        data-canvas-ui=""
        className="pointer-events-none absolute z-20 border-[1.5px] border-[var(--canvas-mark)]"
        style={{
          left: cx,
          top: cy,
          width: size,
          height: size,
          transform: `translate(-50%, -50%) rotate(${sticker.rotate}deg)`,
        }}
      >
        {CORNERS.map((corner) => (
          <span
            key={corner}
            title={labels.resize}
            className={`${handleClass} size-3.5 rounded-sm ${corner}`}
            onPointerDown={(e) => begin(e, "resize")}
            onMouseDown={(e) => e.preventDefault()}
          />
        ))}
        <span
          aria-hidden="true"
          className="absolute top-full left-1/2 h-5 w-px -translate-x-1/2 bg-[var(--canvas-mark)]"
        />
        <span
          title={labels.rotate}
          className={`${handleClass} top-[calc(100%+1.75rem)] left-1/2 grid size-6 cursor-grab place-items-center rounded-full text-[var(--canvas-mark)]`}
          onPointerDown={(e) => begin(e, "rotate")}
          onMouseDown={(e) => e.preventDefault()}
        >
          <RotateCw className="size-3.5" />
        </span>
      </div>

      <div
        data-canvas-ui=""
        className="absolute z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-full border glass-strong p-1 text-foreground shadow-lg"
        style={{ left: Math.min(Math.max(cx, 64), box.canvasWidth - 64), top: toolbarTop }}
      >
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
          className="size-8"
          aria-label={labels.front}
          onClick={p.onFront}
        >
          <BringToFront />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-destructive"
          aria-label={labels.remove}
          onClick={p.onRemove}
        >
          <Trash2 />
        </Button>
      </div>
    </>
  );
}
