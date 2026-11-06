import type { Dispatch, RefObject, SetStateAction } from "react";
import { MAX_STICKERS, type Section, type Sticker } from "@/features/gifts/schemas";
import type { StickerKind } from "@/features/gifts/stickers";
import { stickerAt, stickerContainer, stickerOnScreen, trackPointer } from "./canvas-geometry";

type Options = {
  canvasRef: RefObject<HTMLElement | null>;
  sections: Section[];
  stickers: Sticker[];
  setStickers: Dispatch<SetStateAction<Sticker[]>>;
  /** Makes a sticker the one thing selected on the gift, letting go of any section or text. */
  select: (id: string) => void;
  /** Marks a sticker as selected and nothing more. */
  setSelected: (id: string | null) => void;
  /** Called once a new sticker is on the gift. */
  onAdded: () => void;
  /** Called when a drag ends, so the click the browser sends right after it picks nothing. */
  onDragEnd: () => void;
};

/** What can be done to stickers on the gift: change one, add one, drag one, copy one. */
export function useStickerActions({
  canvasRef,
  sections,
  stickers,
  setStickers,
  select,
  setSelected,
  onAdded,
  onDragEnd,
}: Options) {
  const patchSticker = (id: string, next: (s: Sticker) => Sticker) =>
    setStickers((all) => all.map((s) => (s.id === id ? next(s) : s)));

  /** Puts a new sticker in the middle of the part of the gift that is on screen. */
  const addSticker = (kind: StickerKind) => {
    const canvas = canvasRef.current;
    if (!canvas || stickers.length >= MAX_STICKERS) return;
    const frame = canvas.getBoundingClientRect();
    const top = Math.max(frame.top, 72);
    const bottom = Math.min(frame.bottom, window.innerHeight - 72);
    // Each new one lands a little off the last, so they do not hide each other.
    const offset = ((stickers.length % 5) - 2) * 18;
    const sticker = stickerAt(
      canvas,
      sections,
      { id: crypto.randomUUID(), kind, rotate: 0 },
      {
        cx: frame.left + frame.width / 2 + offset,
        cy: (bottom > top ? (top + bottom) / 2 : frame.top + frame.height / 2) + offset,
        size: frame.width * 0.16,
      },
    );
    setStickers([...stickers, sticker]);
    select(sticker.id);
    onAdded();
  };

  /** Drags a sticker with the pointer. On release it settles on the section under it. */
  const dragSticker = (e: React.PointerEvent, id: string) => {
    const canvas = canvasRef.current;
    const sticker = stickers.find((s) => s.id === id);
    if (!canvas || !sticker) return;
    const start = stickerOnScreen(canvas, sections, sticker);
    const box = stickerContainer(canvas, sections, sticker)?.getBoundingClientRect();
    if (!start || !box) return;
    e.preventDefault();
    select(id);
    const origin = { x: e.clientX, y: e.clientY };
    let moved: { dx: number; dy: number } | null = null;
    trackPointer(
      (ev) => {
        const dx = ev.clientX - origin.x;
        const dy = ev.clientY - origin.y;
        if (!moved && Math.hypot(dx, dy) < 4) return;
        moved = { dx, dy };
        patchSticker(id, (s) => ({
          ...s,
          x: sticker.x + (dx / box.width) * 100,
          y: sticker.y + (dy / box.height) * 100,
        }));
      },
      () => {
        if (!moved) return;
        const { dx, dy } = moved;
        patchSticker(id, (s) =>
          stickerAt(canvas, sections, s, {
            cx: start.cx + dx,
            cy: start.cy + dy,
            size: start.size,
          }),
        );
        onDragEnd();
      },
    );
  };

  const duplicateSticker = (sticker: Sticker) => {
    if (stickers.length >= MAX_STICKERS) return;
    const copy = {
      ...sticker,
      id: crypto.randomUUID(),
      x: Math.min(sticker.x + 5, 120),
      y: Math.min(sticker.y + 5, 150),
    };
    setStickers([...stickers, copy]);
    setSelected(copy.id);
  };

  return { patchSticker, addSticker, dragSticker, duplicateSticker };
}
