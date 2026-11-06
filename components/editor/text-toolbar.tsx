"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Italic,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { TEXT_FONTS } from "@/components/gift/text-fonts";
import { TEXT_FONT_KEYS, type TextStyle } from "@/features/gifts/schemas";
import { cn } from "@/lib/utils";

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;

/** Ready-made text colours, dark to light then round the wheel. */
const SWATCHES = [
  "#1f1f1f",
  "#6b7280",
  "#ffffff",
  "#e11d48",
  "#f97316",
  "#f59e0b",
  "#16a34a",
  "#0d9488",
  "#0ea5e9",
  "#2563eb",
  "#7c3aed",
  "#db2777",
];

type Align = NonNullable<TextStyle["align"]>;

/** How the text looks right now, design and creator's style together. */
type Shown = { bold: boolean; italic: boolean; align: Align; color: string };

/**
 * Reads how a text is drawn, so the buttons show what is on screen even when
 * it comes from the design (a heading that is bold or centred on its own).
 */
function useShown(
  canvas: RefObject<HTMLElement | null>,
  selector: string,
  watch: unknown,
): Shown | null {
  const [shown, setShown] = useState<{ selector: string; value: Shown } | null>(null);

  useLayoutEffect(() => {
    const outer = canvas.current;
    const el = outer?.querySelector<HTMLElement>(selector);
    if (!outer || !el) return;
    const read = () => {
      const cs = getComputedStyle(el);
      const value: Shown = {
        bold: Number.parseInt(cs.fontWeight, 10) >= 600,
        italic: cs.fontStyle === "italic",
        align:
          cs.textAlign === "center"
            ? "center"
            : cs.textAlign === "right" || cs.textAlign === "end"
              ? "right"
              : "left",
        color: cs.color,
      };
      setShown((prev) =>
        prev &&
        prev.selector === selector &&
        (Object.keys(value) as (keyof Shown)[]).every((k) => prev.value[k] === value[k])
          ? prev
          : { selector, value },
      );
    };
    // The observer reports once as soon as it starts, which is the first read.
    const observer = new ResizeObserver(read);
    observer.observe(outer);
    return () => observer.disconnect();
  }, [canvas, selector, watch]);

  return shown && shown.selector === selector ? shown.value : null;
}

type Props = {
  canvas: RefObject<HTMLElement | null>;
  /** The text being edited. */
  selector: string;
  /** Anything that changes when the text's look may have. */
  watch: unknown;
  /** The creator's own style for the text. */
  style: TextStyle | undefined;
  /** Changes the style. A value of undefined goes back to the design's own. */
  onChange: (patch: Partial<TextStyle>) => void;
  onReset: () => void;
  labels: {
    tools: string;
    font: string;
    designFont: string;
    smaller: string;
    larger: string;
    bold: string;
    italic: string;
    alignLeft: string;
    alignCenter: string;
    alignRight: string;
    color: string;
    designColor: string;
    customColor: string;
    reset: string;
  };
};

const ALIGN_ICONS: Record<Align, React.ComponentType<{ className?: string }>> = {
  left: AlignLeft,
  center: AlignCenter,
  right: AlignRight,
};
const NEXT_ALIGN: Record<Align, Align> = { left: "center", center: "right", right: "left" };

/**
 * Font, size, weight, alignment and colour for the text being edited. Its
 * buttons never take focus from the text, so typing carries on between
 * changes.
 */
export function TextToolbar({ canvas, selector, watch, style, onChange, onReset, labels }: Props) {
  const shown = useShown(canvas, selector, watch);
  const [open, setOpen] = useState<"font" | "color" | null>(null);
  const root = useRef<HTMLDivElement>(null);

  // A press anywhere else closes the open list.
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!(e.target instanceof Node) || !root.current?.contains(e.target)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const scale = style?.scale ?? 1;
  const setScale = (next: number) =>
    onChange({ scale: Math.min(Math.max(Math.round(next * 20) / 20, MIN_SCALE), MAX_SCALE) });
  const align = shown?.align ?? "left";
  const AlignIcon = ALIGN_ICONS[align];
  const alignLabel = {
    left: labels.alignLeft,
    center: labels.alignCenter,
    right: labels.alignRight,
  }[NEXT_ALIGN[align]];
  // A gradient heading has no single colour to show.
  const colorShown =
    style?.color ??
    (shown && !/, 0\)$/.test(shown.color) && shown.color !== "transparent"
      ? shown.color
      : undefined);

  return (
    <div
      ref={root}
      data-canvas-ui=""
      role="toolbar"
      aria-label={labels.tools}
      className="relative mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-1 rounded-2xl border glass-strong p-1 text-foreground shadow-lg"
      // Keeps the caret in the text while a tool is pressed.
      onMouseDown={(e) => {
        if (!(e.target instanceof HTMLInputElement)) e.preventDefault();
      }}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open === "font"}
        aria-label={labels.font}
        onClick={() => setOpen(open === "font" ? null : "font")}
        className={cn(toolClass(open === "font"), "w-28 justify-between gap-1 px-2.5 sm:w-32")}
      >
        <span className={cn("truncate text-sm", style?.font && TEXT_FONTS[style.font].className)}>
          {style?.font ? TEXT_FONTS[style.font].label : labels.font}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-60" />
      </button>

      <div className="flex items-center">
        <button
          type="button"
          aria-label={labels.smaller}
          disabled={scale <= MIN_SCALE}
          onClick={() => setScale(scale - 0.1)}
          className={toolClass(false)}
        >
          <Minus className="size-4" />
        </button>
        <span aria-hidden="true" className="w-10 text-center text-xs font-semibold tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          aria-label={labels.larger}
          disabled={scale >= MAX_SCALE}
          onClick={() => setScale(scale + 0.1)}
          className={toolClass(false)}
        >
          <Plus className="size-4" />
        </button>
      </div>

      <button
        type="button"
        aria-label={labels.bold}
        aria-pressed={shown?.bold ?? false}
        onClick={() => onChange({ bold: !(shown?.bold ?? false) })}
        className={toolClass(shown?.bold ?? false)}
      >
        <Bold className="size-4" />
      </button>
      <button
        type="button"
        aria-label={labels.italic}
        aria-pressed={shown?.italic ?? false}
        onClick={() => onChange({ italic: !(shown?.italic ?? false) })}
        className={toolClass(shown?.italic ?? false)}
      >
        <Italic className="size-4" />
      </button>
      <button
        type="button"
        aria-label={alignLabel}
        onClick={() => onChange({ align: NEXT_ALIGN[align] })}
        className={toolClass(false)}
      >
        <AlignIcon className="size-4" />
      </button>

      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open === "color"}
        aria-label={labels.color}
        onClick={() => setOpen(open === "color" ? null : "color")}
        className={toolClass(open === "color")}
      >
        <span
          aria-hidden="true"
          className="size-5 rounded-full border border-black/15 ring-1 ring-white/40"
          style={{
            background:
              colorShown ?? "conic-gradient(#f0417f, #ffac1c, #3ec27a, #1fb5c9, #8a63f5, #f0417f)",
          }}
        />
      </button>

      <button
        type="button"
        aria-label={labels.reset}
        disabled={!style}
        onClick={onReset}
        className={toolClass(false)}
      >
        <RotateCcw className="size-4" />
      </button>

      {open === "font" && (
        <div className={popoverClass}>
          <div className="grid grid-cols-2 gap-1">
            {TEXT_FONT_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={style?.font === key}
                onClick={() => {
                  onChange({ font: key });
                  setOpen(null);
                }}
                className={cn(
                  choiceClass(style?.font === key),
                  TEXT_FONTS[key].className,
                  "text-lg",
                )}
              >
                {TEXT_FONTS[key].label}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!style?.font}
            onClick={() => {
              onChange({ font: undefined });
              setOpen(null);
            }}
            className={cn(choiceClass(false), "mt-1 w-full text-sm")}
          >
            {labels.designFont}
          </button>
        </div>
      )}

      {open === "color" && (
        <div className={popoverClass}>
          <div className="grid grid-cols-6 gap-2 p-1">
            {SWATCHES.map((hex) => (
              <button
                key={hex}
                type="button"
                aria-label={hex}
                aria-pressed={style?.color === hex}
                onClick={() => onChange({ color: hex })}
                className={cn(
                  "aspect-square cursor-pointer rounded-full border border-black/15 outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  style?.color === hex && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                )}
                style={{ background: hex }}
              />
            ))}
          </div>
          <div className="mt-1 grid grid-cols-2 gap-1">
            <label className={cn(choiceClass(false), "relative gap-2 text-sm")}>
              <span
                aria-hidden="true"
                className="size-4 rounded-full"
                style={{
                  background:
                    "conic-gradient(#f0417f, #ffac1c, #3ec27a, #1fb5c9, #8a63f5, #f0417f)",
                }}
              />
              {labels.customColor}
              <input
                type="color"
                value={style?.color ?? "#000000"}
                onChange={(e) => onChange({ color: e.target.value })}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
            </label>
            <button
              type="button"
              disabled={!style?.color}
              onClick={() => {
                onChange({ color: undefined });
                setOpen(null);
              }}
              className={cn(choiceClass(false), "text-sm")}
            >
              {labels.designColor}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const toolClass = (active: boolean) =>
  cn(
    "flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-default disabled:opacity-40",
    active ? "bg-accent text-accent-foreground" : "hover:bg-secondary",
  );

const choiceClass = (active: boolean) =>
  cn(
    "flex h-10 cursor-pointer items-center justify-center rounded-xl border px-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-default disabled:opacity-40",
    active
      ? "border-primary bg-accent text-accent-foreground"
      : "border-transparent hover:bg-secondary",
  );

/** Lists open centred under the toolbar, so they stay on screen on a phone. */
const popoverClass =
  "absolute top-full left-1/2 z-10 mt-2 w-[min(19rem,calc(100vw-2rem))] glass-strong -translate-x-1/2 rounded-2xl border p-2 shadow-xl";
