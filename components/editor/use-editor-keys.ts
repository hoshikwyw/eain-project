import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { Sticker } from "@/features/gifts/schemas";

/**
 * Ctrl or Cmd with Z, Shift+Z, Y and S. Undo is the editor's own everywhere,
 * texts included, so one history covers typing, styling and moving.
 */
export function useEditorShortcuts({ undo, redo, save }: { undo: () => void; redo: () => void; save: () => void }) {
  // No dependency list on purpose: the three functions are new on every render, and so is the listener.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "z" || key === "y") {
        e.preventDefault();
        if (key === "y" || e.shiftKey) redo();
        else undo();
      } else if (key === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
}

/** Keys for the selected sticker: Delete removes it, Escape lets go of it, arrows nudge it. */
export function useStickerKeys(selected: string | null, setStickers: Dispatch<SetStateAction<Sticker[]>>, setSelected: (id: string | null) => void) {
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target;
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        setStickers((all) => all.filter((s) => s.id !== selected));
        setSelected(null);
      } else if (e.key === "Escape") {
        setSelected(null);
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        const dx = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
        const dy = e.key === "ArrowDown" ? step : e.key === "ArrowUp" ? -step : 0;
        setStickers((all) =>
          all.map((s) => (s.id === selected ? { ...s, x: Math.min(Math.max(s.x + dx, -20), 120), y: Math.min(Math.max(s.y + dy, -50), 150) } : s)),
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, setStickers, setSelected]);
}
