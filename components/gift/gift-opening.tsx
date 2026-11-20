import { Heart, Sparkles } from "lucide-react";
import { Lovebirds } from "@/components/brand/lovebirds";
import type { GiftColors, Opening, ThemeVariant } from "@/features/gifts/schemas";
import { giftPalette } from "./palettes";

/** How long each opening plays before the gift content shows. */
export const OPENING_MS: Record<Opening, number> = {
  envelope: 2200,
  book: 2100,
  giftbox: 2000,
  curtain: 1900,
  scroll: 2000,
  simple: 900,
};

/** Plays in a blink for people who ask their device for less motion. */
export function openingDuration(kind: Opening): number {
  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return reduced ? 150 : OPENING_MS[kind];
}

export type OpeningStage = "closed" | "opening";

type Props = {
  kind: Opening;
  variant: ThemeVariant;
  colors?: GiftColors;
  stage: OpeningStage;
  /** Shown on the closed object, for example "For Su". */
  label: string;
};

/**
 * The closed gift object and its opening animation, dressed in the gift's
 * look. Motion lives in globals.css under "Gift openings" and starts when
 * `stage` turns to "opening".
 */
export function GiftOpening({ kind, variant, colors, stage, label }: Props) {
  return (
    <div
      className="eo"
      data-stage={stage}
      data-kind={kind}
      style={
        {
          ...giftPalette(variant, colors),
          "--eo-ms": `${OPENING_MS[kind]}ms`,
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <div className="eo-scene">
        {kind === "envelope" && <Envelope label={label} />}
        {kind === "book" && <Book label={label} />}
        {kind === "giftbox" && <GiftBox label={label} />}
        {kind === "curtain" && <Curtain label={label} />}
        {kind === "scroll" && <Scroll label={label} />}
        {kind === "simple" && (
          <div className="w-64 max-w-full">
            <Lovebirds />
          </div>
        )}
      </div>
    </div>
  );
}

const mix = (pct: number, base = "var(--t-card)") =>
  `color-mix(in oklab, var(--t-accent) ${pct}%, ${base})`;

function PaperLines({ count }: { count: number }) {
  return (
    <div className="flex w-full flex-col gap-2.5">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="h-1.5 rounded-full bg-[var(--t-accent-soft)]"
          style={{ width: `${[92, 78, 86, 60, 80][i % 5]}%` }}
        />
      ))}
    </div>
  );
}

function Seal({ className }: { className?: string }) {
  return (
    <span
      className={`grid size-11 place-items-center rounded-full text-[color:var(--t-on-accent,#fff)] shadow-[inset_0_2px_3px_rgba(255,255,255,0.35),inset_0_-3px_4px_rgba(0,0,0,0.28),0_3px_6px_rgba(0,0,0,0.3)] ring-4 ring-[color-mix(in_oklab,var(--t-accent)_35%,transparent)] [background:radial-gradient(circle_at_35%_30%,color-mix(in_oklab,var(--t-accent),white_25%),var(--t-accent)_60%,color-mix(in_oklab,var(--t-accent),black_20%))] ${className ?? ""}`}
    >
      <Heart className="size-5 fill-current" />
    </span>
  );
}

/** Flap lifts, the letter slides out. */
function Envelope({ label }: { label: string }) {
  return (
    <div className="relative mt-24 h-48 w-72">
      <div
        className="absolute inset-0 rounded-lg shadow-xl ring-1 ring-black/10"
        style={{ background: mix(38) }}
      />
      {/* The liner, seen once the flap lifts. */}
      <div
        className="absolute inset-0 rounded-lg [clip-path:polygon(0_0,100%_0,50%_62%)]"
        style={{
          background: `repeating-linear-gradient(135deg, ${mix(28)} 0 5px, ${mix(48)} 5px 11px)`,
        }}
      />
      <div className="pattern-paper pointer-events-none absolute inset-0 rounded-lg opacity-25" />
      <div className="eo-env-letter absolute inset-x-4 top-3 bottom-3 z-[1] flex flex-col gap-4 rounded-md bg-[var(--t-card)] p-5 shadow-md">
        <p className="font-display text-xl font-semibold text-[color:var(--t-accent)]">{label}</p>
        <PaperLines count={3} />
      </div>
      <div className="absolute inset-0 z-[2] drop-shadow-[0_-1px_1px_rgba(0,0,0,0.12)]">
        <div
          className="h-full w-full rounded-lg [clip-path:polygon(0_0,50%_58%,100%_0,100%_100%,0_100%)]"
          style={{ background: `linear-gradient(180deg, ${mix(18)}, ${mix(24)})` }}
        />
        <div className="pattern-paper pointer-events-none absolute inset-0 rounded-lg opacity-25 [clip-path:polygon(0_0,50%_58%,100%_0,100%_100%,0_100%)]" />
      </div>
      <div className="eo-env-flap absolute inset-x-0 top-0 z-[4] h-[62%] origin-top drop-shadow-[0_2px_2px_rgba(0,0,0,0.12)]">
        <div
          className="h-full w-full [clip-path:polygon(0_0,100%_0,50%_100%)]"
          style={{ background: `linear-gradient(180deg, ${mix(26)}, ${mix(36)})` }}
        />
        <div className="pattern-paper pointer-events-none absolute inset-0 opacity-25 [clip-path:polygon(0_0,100%_0,50%_100%)]" />
        <Seal className="eo-env-seal absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2" />
      </div>
    </div>
  );
}

/** The cover swings open on its spine. */
function Book({ label }: { label: string }) {
  return (
    <div className="eo-book relative h-72 w-52 [transform-style:preserve-3d] max-sm:scale-75">
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-r-md bg-[var(--t-card)] px-6"
        style={{
          boxShadow: `3px 3px 0 ${mix(12)}, 6px 6px 0 ${mix(22)}, 0 18px 40px rgba(0,0,0,0.18)`,
        }}
      >
        <Heart className="size-7 fill-[var(--t-accent)] text-[color:var(--t-accent)]" />
        <PaperLines count={4} />
      </div>
      <div className="eo-book-cover absolute inset-0 origin-left [transform-style:preserve-3d]">
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-r-lg p-4 text-center text-[color:var(--t-on-accent,#fff)] shadow-lg [backface-visibility:hidden]"
          style={{
            background: `linear-gradient(90deg, rgba(0,0,0,0.22) 0 10px, transparent 10px), linear-gradient(160deg, var(--t-accent), ${mix(70, "#000")})`,
          }}
        >
          <div className="absolute inset-3 left-5 rounded-md border-2 border-[var(--t-deco)] opacity-70" />
          <Sparkles className="size-6 text-[color:var(--t-deco)]" />
          <p className="font-display text-2xl leading-tight font-semibold text-balance">{label}</p>
          <span className="h-0.5 w-12 rounded-full bg-[var(--t-deco)]" />
        </div>
        <div
          className="absolute inset-0 [transform:rotateY(180deg)] rounded-l-lg [backface-visibility:hidden]"
          style={{ background: mix(22) }}
        />
      </div>
    </div>
  );
}

const CONFETTI = Array.from({ length: 16 }, (_, i) => {
  const angle = (-170 + (i * 160) / 15) * (Math.PI / 180);
  const dist = 110 + ((i * 37) % 60);
  return {
    x: Math.round(Math.cos(angle) * dist),
    y: Math.round(Math.sin(angle) * dist),
    r: (i * 97) % 360,
    c: (i % 5) + 1,
    round: i % 3 === 0,
  };
});

/** The lid pops off in a burst of light and confetti. */
function GiftBox({ label }: { label: string }) {
  return (
    <div className="eo-box relative h-64 w-56">
      <div className="eo-box-glow absolute top-16 left-1/2 size-56 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--t-deco)_0%,transparent_65%)] opacity-0" />
      {CONFETTI.map((p, i) => (
        <span
          key={i}
          className={`eo-box-confetti absolute top-24 left-1/2 opacity-0 ${p.round ? "size-2.5 rounded-full" : "h-3.5 w-2 rounded-sm"}`}
          style={
            {
              background: `var(--t-c${p.c}, var(${p.c % 2 ? "--t-accent" : "--t-deco"}))`,
              "--x": `${p.x}px`,
              "--y": `${p.y}px`,
              "--r": `${p.r}deg`,
            } as React.CSSProperties
          }
        />
      ))}
      <div
        className="absolute inset-x-4 bottom-0 h-36 overflow-hidden rounded-b-lg shadow-xl"
        style={{
          background: `linear-gradient(90deg, rgba(0,0,0,0.16), rgba(0,0,0,0) 28%, rgba(0,0,0,0) 72%, rgba(0,0,0,0.16)), linear-gradient(180deg, ${mix(80, "#000")} 0 10px, var(--t-accent) 10px)`,
        }}
      >
        <span className="absolute inset-y-0 left-1/2 w-7 -translate-x-1/2 [background:linear-gradient(90deg,var(--t-deco),color-mix(in_oklab,var(--t-deco),white_40%)_50%,var(--t-deco))]" />
        <span className="absolute bottom-4 left-4 rounded-md bg-[var(--t-card)] px-2.5 py-1 font-display text-sm font-semibold text-[color:var(--t-fg)] shadow">
          {label}
        </span>
      </div>
      <div className="eo-box-lid absolute inset-x-1 bottom-36 h-11">
        <div
          className="absolute inset-0 rounded-md shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_4px_8px_-2px_rgba(0,0,0,0.3)]"
          style={{ background: `linear-gradient(180deg, ${mix(78, "#fff")}, ${mix(90, "#fff")})` }}
        />
        <span className="absolute inset-y-0 left-1/2 w-7 -translate-x-1/2 [background:linear-gradient(90deg,var(--t-deco),color-mix(in_oklab,var(--t-deco),white_40%)_50%,var(--t-deco))]" />
        <span className="absolute -top-7 left-1/2 h-9 w-12 -translate-x-[95%] -rotate-[25deg] rounded-[50%] border-[7px] border-[var(--t-deco)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />
        <span className="absolute -top-7 left-1/2 h-9 w-12 -translate-x-[5%] rotate-[25deg] rounded-[50%] border-[7px] border-[var(--t-deco)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />
        <span className="absolute -top-2.5 left-1/2 size-5 -translate-x-1/2 rounded-full shadow [background:radial-gradient(circle_at_35%_30%,color-mix(in_oklab,var(--t-deco),white_45%),var(--t-deco)_65%)]" />
      </div>
    </div>
  );
}

const pleats = (dir: "90deg" | "270deg") =>
  `linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.3)), repeating-linear-gradient(${dir}, var(--t-accent) 0 6px, color-mix(in oklab, var(--t-accent), white 12%) 6px 12px, ${mix(72, "#000")} 12px 20px, var(--t-accent) 20px 30px)`;

/** Stage curtains draw back to the sides. */
function Curtain({ label }: { label: string }) {
  return (
    <div className="relative h-64 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl shadow-xl">
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, var(--t-card) 0%, ${mix(30)} 70%)`,
        }}
      >
        <Sparkles className="eo-curtain-spark size-8 text-[color:var(--t-deco)]" />
        <p className="font-display text-2xl font-semibold text-[color:var(--t-fg)]">{label}</p>
      </div>
      <div
        className="eo-curtain-left absolute inset-y-0 left-0 w-1/2 origin-left"
        style={{ background: pleats("90deg") }}
      />
      <div
        className="eo-curtain-right absolute inset-y-0 right-0 w-1/2 origin-right"
        style={{ background: pleats("270deg") }}
      />
      <div
        className="absolute inset-x-0 top-0 h-7 border-b-4 border-[var(--t-deco)] shadow-[0_6px_10px_-4px_rgba(0,0,0,0.5)]"
        style={{
          background: `repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 2px, rgba(0,0,0,0) 2px 9px), linear-gradient(180deg, ${mix(70, "#000")}, var(--t-accent))`,
        }}
      />
    </div>
  );
}

function Roller() {
  return (
    <div
      className="relative z-[1] h-5 w-64 rounded-full shadow-md"
      style={{
        background: `linear-gradient(180deg, ${mix(55, "#fff")}, var(--t-accent) 55%, ${mix(70, "#000")})`,
      }}
    >
      <span className="absolute top-1/2 -left-2 size-6 -translate-y-1/2 rounded-full bg-[var(--t-deco)] shadow" />
      <span className="absolute top-1/2 -right-2 size-6 -translate-y-1/2 rounded-full bg-[var(--t-deco)] shadow" />
    </div>
  );
}

/** The ribbon comes off and the scroll unrolls. */
function Scroll({ label }: { label: string }) {
  return (
    <div className="relative flex h-80 w-72 flex-col items-center justify-center">
      <Roller />
      <div className="eo-scroll-paper -my-2 flex h-0 w-56 flex-col items-center gap-4 overflow-hidden bg-[var(--t-card)] px-6 shadow-inner">
        <Sparkles className="mt-8 size-6 shrink-0 text-[color:var(--t-deco)]" />
        <p className="font-display text-xl font-semibold text-[color:var(--t-accent)]">{label}</p>
        <PaperLines count={3} />
      </div>
      <Roller />
      <div className="eo-scroll-tie absolute top-1/2 left-1/2 z-[2] -translate-x-1/2 -translate-y-1/2">
        <span className="absolute top-1/2 left-1/2 h-16 w-5 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-[var(--t-accent)] shadow" />
        <Seal className="relative" />
      </div>
    </div>
  );
}
