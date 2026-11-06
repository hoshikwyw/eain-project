import type { Decoration } from "@/features/gifts/templates";
import { cn } from "@/lib/utils";

/**
 * Purely visual pieces of a gift: the illustration, background patterns,
 * the small label above the heading, and the scatter of confetti and
 * sparkles. None of them carries the creator's content.
 */

export function Illustration({ src, className }: { src: string; className?: string }) {
  return (
    <div className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset, optimiser bypassed on purpose */}
      <img src={src} alt="" width={1200} height={800} loading="lazy" decoding="async" className="float-slow h-auto w-full select-none" draggable={false} />
    </div>
  );
}

export function Pattern({ kind, opacity = 0.35 }: { kind: "dots" | "stripes" | "lines" | "grid" | "rays"; opacity?: number }) {
  return <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", `pattern-${kind}`)} style={{ opacity }} />;
}

export function Eyebrow({ text, className }: { text: string; className?: string }) {
  return <p className={cn("text-xs font-semibold tracking-[0.2em] uppercase text-[color:var(--t-muted)]", className)}>{text}</p>;
}

/** Party colour n (1..5) with a fallback to the accent, so every palette works. */
export const partyColor = (n: number) => `var(--t-c${((n - 1) % 5) + 1}, var(--t-accent))`;

/**
 * Multicoloured confetti for birthday designs: strips, dots, rings and
 * sparkles in the palette's five party colours. Fixed positions keep the
 * server and client render identical.
 */
function PartyConfetti() {
  // [left %, top %, shape, colour 1..5, rotation]
  const pieces: [number, number, "strip" | "dot" | "ring" | "spark", number, number][] = [
    [4, 14, "strip", 1, 20], [11, 38, "dot", 3, 0], [3, 62, "ring", 4, 0], [9, 86, "strip", 2, -30],
    [18, 6, "spark", 2, 0], [27, 94, "dot", 5, 0], [36, 4, "strip", 4, 60], [47, 96, "ring", 1, 0],
    [55, 5, "dot", 1, 0], [63, 93, "strip", 3, -15], [72, 7, "ring", 5, 0], [80, 95, "spark", 4, 0],
    [88, 20, "strip", 5, 40], [95, 42, "dot", 2, 0], [91, 66, "strip", 1, -50], [97, 88, "ring", 3, 0],
    [50, 50, "spark", 3, 0], [22, 70, "strip", 3, 75],
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
      {pieces.map(([x, y, shape, c, rot], i) => {
        const color = partyColor(c);
        const base = { left: `${x}%`, top: `${y}%`, transform: `rotate(${rot}deg)` };
        switch (shape) {
          case "strip":
            return <span key={i} className="absolute h-3.5 w-1.5 rounded-sm opacity-85" style={{ ...base, background: color }} />;
          case "dot":
            return <span key={i} className="absolute size-2 rounded-full opacity-85" style={{ ...base, background: color }} />;
          case "ring":
            return <span key={i} className="absolute size-2.5 rounded-full border-2 opacity-80" style={{ ...base, borderColor: color }} />;
          case "spark":
            return (
              <span key={i} className="absolute text-sm leading-none" style={{ ...base, color }}>
                ✦
              </span>
            );
        }
      })}
    </div>
  );
}

/** Purely visual scatter. Reads --t-deco and --glow from the palette. */
export function Decorations({ kind }: { kind: Decoration }) {
  if (kind === "party") return <PartyConfetti />;
  const spots = [
    [6, 8],
    [88, 12],
    [12, 78],
    [92, 70],
    [50, 4],
    [72, 92],
    [30, 94],
    [64, 40],
  ] as const;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
      {spots.map(([x, y], i) => {
        const style = { left: `${x}%`, top: `${y}%`, transform: `rotate(${(i * 47) % 360}deg)` };
        switch (kind) {
          case "stars":
            return <span key={i} style={style} className="absolute size-1.5 rounded-full bg-[color:var(--glow)] opacity-90" />;
          case "confetti":
            return <span key={i} style={style} className={cn("absolute h-3 w-1.5 rounded-sm opacity-60", i % 2 ? "bg-[color:var(--t-accent)]" : "bg-[color:var(--glow)]")} />;
          case "hearts":
            return (
              <span key={i} style={style} className="absolute text-sm text-[color:var(--t-accent)] opacity-40">
                ♥
              </span>
            );
          case "sparkles":
            return (
              <span key={i} style={style} className="absolute text-base text-[color:var(--glow)] opacity-80">
                ✦
              </span>
            );
          case "leaves":
            return <span key={i} style={style} className="absolute h-4 w-2 rounded-full bg-[color:var(--t-deco)] opacity-50" />;
          case "petals":
          default:
            return <span key={i} style={style} className="absolute size-3 rounded-full bg-[color:var(--t-deco)] opacity-40" />;
        }
      })}
    </div>
  );
}
