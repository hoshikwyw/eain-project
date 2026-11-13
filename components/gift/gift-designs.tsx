import { flowerSwatch } from "@/features/gifts/scene";
import { cn } from "@/lib/utils";
import {
  CardMark,
  Decorations,
  Eyebrow,
  Illustration,
  Pattern,
  partyColor,
} from "./gift-decorations";
import { Sections } from "./gift-sections";
import type { Ctx } from "./gift-types";

/** The design a template asks for, drawn around the gift's sections. */
export function renderDesign(ctx: Ctx) {
  switch (ctx.design) {
    case "postcard":
      return <PostcardDesign {...ctx} />;
    case "party":
      return <PartyDesign {...ctx} />;
    case "elegant":
      return <ElegantDesign {...ctx} />;
    case "playful":
      return <PlayfulDesign {...ctx} />;
    case "botanical":
      return <BotanicalDesign {...ctx} />;
    case "certificate":
      return <CertificateDesign {...ctx} />;
    case "letter":
      return <LetterDesign {...ctx} />;
    case "scrapbook":
      return <ScrapbookDesign {...ctx} />;
    case "bold":
      return <BoldDesign {...ctx} />;
    case "blank":
      return <BlankDesign {...ctx} />;
    case "garden":
      return <GardenDesign {...ctx} />;
    case "minimal":
    default:
      return <MinimalDesign {...ctx} />;
  }
}

/** Rainbow gradient on the cover heading, from the palette's party colours. */
const rainbowHeading =
  "[&_h1]:w-fit [&_h1]:bg-clip-text [&_h1]:text-transparent [&_h1]:[background-image:linear-gradient(100deg,var(--t-c1,var(--t-accent)),var(--t-c2,var(--t-accent))_35%,var(--t-c4,var(--t-accent))_70%,var(--t-c3,var(--t-accent)))]";

/** A string of triangle flags across the top of a card. */
function Bunting({ count }: { count: number }) {
  return (
    <div aria-hidden="true" className="relative px-2 pt-2">
      <span className="absolute inset-x-0 top-2 h-px bg-[color:var(--t-fg)]/20" />
      <div className="flex justify-between">
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            className="h-5 w-4 [clip-path:polygon(0_0,100%_0,50%_100%)]"
            style={{ background: partyColor(i + 1) }}
          />
        ))}
      </div>
    </div>
  );
}

/** Three balloons on strings. */
function Balloons({ className }: { className?: string }) {
  const balloons = [
    { cx: 24, cy: 34, rx: 17, ry: 21, c: 1 },
    { cx: 64, cy: 38, rx: 15, ry: 19, c: 2 },
    { cx: 45, cy: 22, rx: 17, ry: 21, c: 3 },
  ];
  return (
    <svg viewBox="0 0 90 124" aria-hidden="true" className={className}>
      {balloons.map((b) => (
        <path
          key={`s${b.c}`}
          d={`M${b.cx} ${b.cy + b.ry + 3} Q${b.cx + 6} ${(b.cy + 120) / 2} 45 120`}
          fill="none"
          strokeWidth="1.2"
          style={{ stroke: "var(--t-muted)" }}
        />
      ))}
      {balloons.map((b) => (
        <g key={b.c}>
          <ellipse cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} style={{ fill: partyColor(b.c) }} />
          <path
            d={`M${b.cx - 3} ${b.cy + b.ry + 3} L${b.cx} ${b.cy + b.ry - 1} L${b.cx + 3} ${b.cy + b.ry + 3} Z`}
            style={{ fill: partyColor(b.c) }}
          />
          <ellipse
            cx={b.cx - b.rx * 0.38}
            cy={b.cy - b.ry * 0.4}
            rx={b.rx * 0.22}
            ry={b.ry * 0.3}
            fill="#fff"
            opacity="0.45"
          />
        </g>
      ))}
    </svg>
  );
}

/**
 * A birthday postcard with an airmail frame: bunting along the top, the
 * stamp and postmark in the corner, the greeting in party colours, then the
 * address side with the receiver's name on coloured lines and balloons.
 */
function PostcardDesign(ctx: Ctx) {
  const { compact, style, eyebrow } = ctx;
  return (
    <article className="relative overflow-hidden rounded-2xl p-2 shadow-[0_1px_0_rgba(0,0,0,0.06)] [background:repeating-linear-gradient(135deg,var(--t-c1,var(--t-accent))_0_14px,var(--t-card)_14px_28px,var(--t-c3,var(--t-deco))_28px_42px,var(--t-card)_42px_56px)]">
      <div className="relative overflow-hidden rounded-xl [background:var(--t-bg)]">
        <div aria-hidden="true" className="absolute inset-0 opacity-60">
          <Decorations kind={style.decoration} />
        </div>
        <Bunting count={compact ? 11 : 15} />
        <div
          className={cn(
            "relative m-3 flex flex-col overflow-hidden rounded-xl bg-[color:var(--t-card)]/92 shadow-sm",
            compact ? "gap-5 p-5" : "gap-7 p-6",
          )}
        >
          <Pattern kind="paper" opacity={0.1} />
          <div className="relative flex items-start justify-end">
            <span className="relative shrink-0">
              <Postmark
                className={cn("absolute -top-3 -left-16 opacity-55", compact ? "w-24" : "w-28")}
              />
              <Stamp src={style.illustration} className={compact ? "w-20" : "w-24"} />
            </span>
          </div>
          <Sections
            ctx={ctx}
            className={cn("relative", compact ? "gap-4" : "gap-6")}
            itemClassName={rainbowHeading}
          />
          <aside
            className={cn(
              "relative flex flex-col border-t border-dashed border-[color:var(--t-accent-soft)]",
              compact ? "gap-4 pt-4" : "gap-5 pt-5",
            )}
          >
            <div className="flex items-end justify-between gap-4">
              <div className={cn("flex flex-1 flex-col", compact ? "gap-3.5" : "gap-4")}>
                <Eyebrow text={eyebrow} className="text-[color:var(--t-accent)]" />
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-px w-full"
                    style={{ background: partyColor(i + 1), opacity: 0.55 }}
                  />
                ))}
              </div>
              <Balloons className={cn("float-slow shrink-0", compact ? "w-11" : "w-16")} />
            </div>
            <CardMark className="self-end" />
          </aside>
        </div>
      </div>
    </article>
  );
}

/** Streamers, a banner heading and stacked party cards. */
function PartyDesign(ctx: Ctx) {
  const { compact, style, eyebrow, animate } = ctx;
  const [cover, ...rest] = ctx.visible;
  const coverCtx = { ...ctx, visible: cover ? [cover] : [] };
  const restCtx = { ...ctx, visible: rest };
  return (
    <div className="relative overflow-hidden rounded-3xl [background:var(--t-bg)]">
      <div aria-hidden="true" className="pattern-stripes h-4 w-full opacity-70" />
      <Decorations kind="confetti" />
      <div
        className={cn(
          "relative flex flex-col items-center text-center",
          compact ? "gap-4 px-4 pt-4 pb-5" : "gap-6 px-5 pt-6 pb-8",
        )}
      >
        <Illustration src={style.illustration} className={compact ? "max-w-56" : "max-w-sm"} />
        <div
          className={cn(
            "w-full rounded-2xl bg-[color:var(--t-accent)] text-[color:var(--t-on-accent,#fff)] shadow-lg",
            compact ? "px-5 py-4" : "px-7 py-6",
          )}
        >
          <Eyebrow text={eyebrow} className="text-[color:var(--t-on-accent,#fff)] opacity-80" />
          <div className="mt-1 [&_h1]:text-[color:var(--t-on-accent,#fff)] [&_h2]:text-[color:var(--t-on-accent,#fff)] [&_p]:text-[color:var(--t-on-accent,#fff)] [&_span]:text-[color:var(--t-on-accent,#fff)]">
            <Sections ctx={coverCtx} />
          </div>
        </div>
        <Sections
          ctx={restCtx}
          animate={animate}
          className={cn("w-full text-left", compact ? "gap-3" : "gap-4")}
          itemClassName={cn(
            "rounded-2xl border-l-[6px] border-[color:var(--t-accent)] bg-[color:var(--t-card)] shadow-sm",
            compact ? "p-4" : "p-5",
          )}
        />
      </div>
    </div>
  );
}

/** Hairlines, centred serif and a gold inner ring. */
function ElegantDesign(ctx: Ctx) {
  const { compact, style, eyebrow, animate } = ctx;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl [background:var(--t-bg)]",
        compact ? "p-3" : "p-4",
      )}
    >
      <Decorations kind="hearts" />
      <div
        className={cn(
          "relative flex flex-col items-center rounded-2xl bg-[color:var(--t-card)]/92 text-center ring-1 ring-[color:var(--glow)]/70 ring-offset-4 ring-offset-[color:var(--t-card)]",
          compact ? "gap-5 p-6" : "gap-7 p-8",
        )}
      >
        <Eyebrow text={eyebrow} className="tracking-[0.35em] text-[color:var(--glow)]" />
        <span aria-hidden="true" className="h-px w-16 bg-[color:var(--glow)]" />
        <Sections
          ctx={ctx}
          animate={animate}
          className={cn("w-full items-center text-center", compact ? "gap-5" : "gap-7")}
          itemClassName="w-full [&_h1]:italic [&_h1]:font-medium [&_h2]:italic [&_h2]:font-medium [&_blockquote]:border-0 [&_blockquote]:pl-0 [&_footer]:items-center [&_footer]:border-t-0 [&_ol]:text-left"
        />
        <span aria-hidden="true" className="h-px w-16 bg-[color:var(--glow)]" />
        <Illustration src={style.illustration} className={compact ? "max-w-56" : "max-w-sm"} />
      </div>
    </div>
  );
}

/**
 * A sticker sheet for a friend: dashed cut line, the name on a tilted label,
 * the birds, a big handwritten greeting, the message in a speech bubble and
 * the quote in the same hand, so the whole card speaks in one voice.
 */
function PlayfulDesign(ctx: Ctx) {
  const { compact, style, eyebrow } = ctx;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] [background:var(--t-bg)]",
        compact ? "p-3" : "p-4",
      )}
    >
      <Decorations kind="sparkles" />
      <div
        className={cn(
          "relative flex flex-col overflow-hidden rounded-[1.6rem] border-2 border-dashed border-[color:var(--t-accent)]/55 bg-[color:var(--t-card)]/94",
          compact ? "gap-4 p-5" : "gap-5 p-6",
        )}
      >
        <Pattern kind="paper" opacity={0.1} />
        <div className="relative flex items-start justify-between gap-3">
          <span className="inline-flex w-fit -rotate-3 rounded-full bg-[color:var(--t-accent)] px-3 py-1 text-xs font-bold tracking-wide text-[color:var(--t-on-accent,#fff)] uppercase shadow-sm">
            {eyebrow}
          </span>
          <Illustration
            src={style.illustration}
            className={cn("-mt-1 -mr-1", compact ? "max-w-36" : "max-w-44")}
          />
        </div>
        <Sections
          ctx={ctx}
          className={cn("relative", compact ? "gap-4" : "gap-5")}
          itemClassName="[&_h1]:font-hand [&_h1]:text-6xl [&_h1]:font-bold [&_h1]:leading-[0.95] [&_h1]:tracking-normal [&_h1]:text-[color:var(--t-accent)] [&_h2]:font-hand [&_h2]:text-4xl [&_h2]:text-[color:var(--t-accent)] [&_p.msg]:relative [&_p.msg]:rounded-3xl [&_p.msg]:rounded-bl-md [&_p.msg]:bg-[color:var(--t-accent-soft)] [&_p.msg]:px-5 [&_p.msg]:py-4 [&_blockquote]:border-l-0 [&_blockquote]:pl-0 [&_blockquote_p]:font-hand [&_blockquote_p]:text-3xl [&_blockquote_p]:leading-[1.15] [&_blockquote_p]:not-italic [&_blockquote_p]:text-[color:var(--t-fg)]/85 [&_.sig]:font-hand [&_.sig]:text-3xl [&_.sig]:text-[color:var(--t-accent)]"
        />
        <CardMark className="relative self-end" />
      </div>
    </div>
  );
}

/** A sprig of leaves on a curving stem, in the look's greens. */
function Sprig({ className }: { className?: string }) {
  const leaves: [number, number, number][] = [
    [26, 122, -42],
    [46, 100, 32],
    [56, 78, -46],
    [74, 60, 34],
    [82, 42, -50],
    [98, 26, 38],
  ];
  return (
    <svg viewBox="0 0 120 160" aria-hidden="true" className={className} fill="none">
      <path
        d="M10 152 C 30 112, 52 72, 110 12"
        stroke="var(--t-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.75"
      />
      {leaves.map(([x, y, r], i) => (
        <ellipse
          key={i}
          cx={x}
          cy={y}
          rx="7"
          ry="16"
          transform={`rotate(${r} ${x} ${y})`}
          fill={i % 2 ? "var(--t-deco)" : "var(--t-accent)"}
          opacity={i % 2 ? 0.85 : 0.7}
        />
      ))}
    </svg>
  );
}

/** Grained paper with leaf sprigs in two corners, an italic serif greeting and a small bird to close. */
function BotanicalDesign(ctx: Ctx) {
  const { compact, style, eyebrow } = ctx;
  return (
    <article className="relative overflow-hidden rounded-3xl [background:var(--t-bg)]">
      <div aria-hidden="true" className="absolute inset-0 opacity-70">
        <Decorations kind="leaves" />
      </div>
      <div
        className={cn(
          "relative m-2 flex flex-col overflow-hidden rounded-[1.25rem] bg-[color:var(--t-card)]/94 ring-1 ring-[color:var(--t-accent-soft)]",
          compact ? "gap-5 p-6" : "gap-7 p-8",
        )}
      >
        <Pattern kind="paper" opacity={0.12} />
        <Sprig
          className={cn(
            "absolute -top-4 -right-3 -scale-x-100 rotate-[-12deg]",
            compact ? "w-16" : "w-20",
          )}
        />
        <Sprig
          className={cn(
            "absolute -bottom-4 -left-3 -scale-x-100 rotate-[168deg]",
            compact ? "w-16" : "w-20",
          )}
        />
        <Eyebrow text={eyebrow} className="relative text-[color:var(--t-accent)]" />
        <Sections
          ctx={ctx}
          className={cn("relative", compact ? "gap-5" : "gap-7")}
          itemClassName="[&_h1]:font-medium [&_h1]:italic [&_h1]:tracking-normal [&_h2]:font-medium [&_h2]:italic"
        />
        <div
          className={cn(
            "relative flex items-end justify-between gap-4",
            compact ? "pl-16" : "pl-20",
          )}
        >
          <CardMark className="mb-1" />
          <Illustration src={style.illustration} className={compact ? "max-w-28" : "max-w-36"} />
        </div>
      </div>
    </article>
  );
}

/** A gold rosette with two tails, the award on a certificate. */
function Rosette({ className }: { className?: string }) {
  const scallops = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    return [40 + Math.cos(angle) * 22, 40 + Math.sin(angle) * 22] as const;
  });
  return (
    <svg viewBox="0 0 80 110" aria-hidden="true" className={className}>
      <path d="M26 56 L18 104 L32 94 L40 108 L50 60 Z" fill="var(--t-accent)" opacity="0.85" />
      <path d="M54 56 L62 104 L48 94 L40 108 L30 60 Z" fill="var(--t-deco)" opacity="0.9" />
      {scallops.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="7" fill="var(--glow)" />
      ))}
      <circle cx="40" cy="40" r="22" fill="var(--glow)" />
      <circle
        cx="40"
        cy="40"
        r="15"
        fill="none"
        stroke="var(--t-accent)"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <path
        d="M40 31 l2.8 5.7 6.2 0.9 -4.5 4.4 1.1 6.2 -5.6 -2.9 -5.6 2.9 1.1 -6.2 -4.5 -4.4 6.2 -0.9 z"
        fill="var(--t-accent)"
        opacity="0.85"
      />
    </svg>
  );
}

/** An L-shaped ornament for a certificate corner. */
function CornerMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      <path d="M1 23 V1 H23" stroke="var(--glow)" strokeWidth="2" strokeLinecap="square" />
      <path d="M6 18 V6 H18" stroke="var(--glow)" strokeWidth="1" opacity="0.7" />
    </svg>
  );
}

/**
 * A certificate: double rule, ornaments in the corners, a small-caps title
 * over a gold rule, the words centred, and a rosette with the bird at the
 * foot. The mark signs it where a printer would.
 */
function CertificateDesign(ctx: Ctx) {
  const { compact, style, eyebrow } = ctx;
  const corner = compact ? "size-5" : "size-6";
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-xl border-4 border-double border-[color:var(--glow)] [background:var(--t-bg)]",
        compact ? "p-2" : "p-3",
      )}
    >
      <Decorations kind="sparkles" />
      <div
        className={cn(
          "relative flex flex-col items-center overflow-hidden rounded-lg border border-[color:var(--glow)]/60 bg-[color:var(--t-card)]/94 text-center",
          compact ? "gap-5 p-7" : "gap-7 p-9",
        )}
      >
        <Pattern kind="paper" opacity={0.14} />
        <CornerMark className={cn("absolute top-2 left-2", corner)} />
        <CornerMark className={cn("absolute top-2 right-2 rotate-90", corner)} />
        <CornerMark className={cn("absolute right-2 bottom-2 rotate-180", corner)} />
        <CornerMark className={cn("absolute bottom-2 left-2 -rotate-90", corner)} />
        <div className="relative flex w-full items-center gap-3">
          <span aria-hidden="true" className="h-px flex-1 bg-[color:var(--glow)]/70" />
          <Eyebrow text={eyebrow} className="tracking-[0.3em]" />
          <span aria-hidden="true" className="h-px flex-1 bg-[color:var(--glow)]/70" />
        </div>
        <Sections
          ctx={ctx}
          className={cn("relative w-full items-center", compact ? "gap-5" : "gap-7")}
          itemClassName="w-full [&_h1]:text-[2rem] [&_h1]:leading-[1.2] [&_h1]:font-semibold [&_h1]:uppercase [&_h1]:tracking-[0.08em] [&_h1]:after:mx-auto [&_h1]:after:mt-4 [&_h1]:after:block [&_h1]:after:h-0.5 [&_h1]:after:w-20 [&_h1]:after:rounded-full [&_h1]:after:bg-[color:var(--glow)] [&_h1]:after:content-[] [&_h2]:uppercase [&_h2]:tracking-[0.06em] [&_h2]:text-2xl [&_footer]:items-center [&_footer]:border-t-0 [&_.sig]:text-2xl"
        />
        <div className="relative flex items-end justify-center gap-5">
          <Rosette className={cn("mb-1", compact ? "w-10" : "w-12")} />
          <Illustration src={style.illustration} className={compact ? "max-w-32" : "max-w-40"} />
        </div>
        <CardMark className="relative" />
      </div>
    </article>
  );
}

/**
 * A letter pulled from its envelope: the flap and a wax seal at the top,
 * ruled paper written by hand, the photo taped in like a polaroid, and the
 * small bird and the mark at the foot.
 */
function LetterDesign(ctx: Ctx) {
  const { compact, style, eyebrow } = ctx;
  return (
    <div className="relative overflow-hidden rounded-3xl [background:var(--t-bg)]">
      <Decorations kind="stars" />
      <div aria-hidden="true" className="relative h-16">
        <div className="absolute inset-x-0 top-0 h-16 bg-[color:var(--t-accent-soft)] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
        <span className="absolute top-8 left-1/2 z-10 grid size-9 -translate-x-1/2 place-items-center rounded-full bg-[color:var(--t-accent)] text-sm text-[color:var(--t-on-accent,#fff)] shadow-md ring-2 ring-[color:var(--t-card)]/40">
          ♥
        </span>
      </div>
      <div
        className={cn(
          "relative mx-2 -mt-5 mb-2 overflow-hidden rounded-xl bg-[color:var(--t-card)]/95 shadow-md",
          compact ? "p-6 pt-8" : "p-8 pt-10",
        )}
      >
        <Pattern kind="lines" opacity={0.5} />
        <Pattern kind="paper" opacity={0.1} />
        <div className={cn("relative flex flex-col", compact ? "gap-5" : "gap-7")}>
          <Eyebrow
            text={eyebrow}
            className="font-hand text-xl tracking-normal text-[color:var(--t-accent)] normal-case"
          />
          <Sections
            ctx={ctx}
            className={compact ? "gap-5" : "gap-7"}
            itemClassName="[&_h1]:font-hand [&_h1]:text-6xl [&_h1]:font-bold [&_h1]:leading-[0.95] [&_h1]:tracking-normal [&_h2]:font-hand [&_h2]:text-4xl [&_p.msg]:font-hand [&_p.msg]:text-2xl [&_p.msg]:leading-[2rem] [&_.sig]:font-hand [&_.sig]:text-3xl [&_.sig]:text-[color:var(--t-accent)]"
          />
          <div className="flex items-end justify-between gap-4">
            <CardMark className="mb-1" />
            <Illustration src={style.illustration} className={compact ? "max-w-28" : "max-w-32"} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** A postage stamp: the illustration in a perforated frame, the holes punched in the card colour. */
function Stamp({ src, className }: { src: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block rotate-3 rounded-[3px] border-[5px] border-dotted border-[color:var(--t-card)] bg-[color:var(--t-accent-soft)] p-1 shadow-sm",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset, optimiser bypassed on purpose */}
      <img
        src={src}
        alt=""
        width={1200}
        height={800}
        loading="lazy"
        decoding="async"
        className="block h-auto w-full rounded-[2px] select-none"
        draggable={false}
      />
    </span>
  );
}

/** A postmark: a ring with wavy cancel lines, in the muted ink. */
function Postmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 60"
      aria-hidden="true"
      className={cn("text-[color:var(--t-muted)]", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <circle cx="30" cy="30" r="24" />
      <circle cx="30" cy="30" r="18" strokeDasharray="2 3" />
      <path d="M62 18 q10 -6 20 0 t20 0 t12 0" />
      <path d="M62 30 q10 -6 20 0 t20 0 t12 0" />
      <path d="M62 42 q10 -6 20 0 t20 0 t12 0" />
    </svg>
  );
}

/**
 * The back of a postcard: the stamp and postmark in the corner, the message
 * on grained paper with plenty of air, then the address lines for the
 * receiver, and the printer's small imprint at the foot.
 */
function MinimalDesign(ctx: Ctx) {
  const { compact, style, eyebrow } = ctx;
  return (
    <article
      className={cn(
        "relative flex flex-col overflow-hidden rounded-3xl border border-[color:var(--t-accent-soft)] bg-[color:var(--t-card)]",
        compact ? "gap-5 p-6" : "gap-7 p-8",
      )}
    >
      <Pattern kind="paper" opacity={0.12} />
      <div className="relative flex items-start justify-between gap-4">
        <Eyebrow text={eyebrow} className="pt-1" />
        <span className="relative shrink-0">
          <Postmark
            className={cn("absolute -top-3 -left-16 opacity-55", compact ? "w-24" : "w-28")}
          />
          <Stamp src={style.illustration} className={compact ? "w-20" : "w-24"} />
        </span>
      </div>
      <Sections ctx={ctx} className={cn("relative", compact ? "gap-5" : "gap-7")} />
      <div
        aria-hidden="true"
        className={cn(
          "relative flex flex-col border-t border-[color:var(--t-accent-soft)]",
          compact ? "gap-5 pt-4" : "gap-6 pt-5",
        )}
      >
        <span className="h-px w-full bg-[color:var(--t-accent-soft)]" />
        <span className="h-px w-3/4 bg-[color:var(--t-accent-soft)]" />
      </div>
      <CardMark className="relative -mt-2 self-start" />
    </article>
  );
}

/**
 * An empty card: a sheet of faintly grained paper in the look's card colour,
 * a hairline frame a little way in from the edge, and the creator's
 * sections. No label, illustration or decoration, so everything on it is
 * theirs. Tall enough when nearly empty to leave room for stickers.
 */
function BlankDesign(ctx: Ctx) {
  const { compact } = ctx;
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-3xl [background:var(--t-bg)]",
        compact ? "p-2" : "p-3",
      )}
    >
      <div
        className={cn(
          "relative flex min-h-[24rem] flex-col overflow-hidden rounded-[1.25rem] bg-[color:var(--t-card)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
          compact ? "gap-5 p-7" : "gap-7 p-9",
        )}
      >
        <Pattern kind="paper" opacity={0.16} />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute rounded-[0.9rem] border border-[color:var(--t-accent-soft)]",
            compact ? "inset-2.5" : "inset-3.5",
          )}
        />
        <div className={cn("relative flex flex-1 flex-col", compact ? "gap-5" : "gap-7")}>
          <Sections ctx={ctx} className={compact ? "gap-5" : "gap-7"} />
          <CardMark className="mt-auto self-end pt-4" />
        </div>
      </div>
    </article>
  );
}

/**
 * Summary card of the Night Garden animation: the same twilight sky, the name
 * in script, the message pages one under the other, and a row of flowers in
 * the colour the creator picked. The receiver sees the animation itself
 * (public/scenes/night-garden); this is its still picture.
 */
function GardenDesign(ctx: Ctx) {
  const { compact } = ctx;
  const { petal, edge } = flowerSwatch[ctx.scene?.flower ?? "white"];
  // [x, height of the stem, size of the bloom]
  const flowers: [number, number, number][] = [
    [48, 46, 15],
    [118, 70, 19],
    [200, 88, 22],
    [282, 66, 19],
    [352, 44, 15],
  ];
  return (
    <article className="relative overflow-hidden rounded-3xl [background:linear-gradient(to_bottom,#2f2560_0%,#4b3b8a_30%,#7d63b8_56%,#e59ac4_82%,#ffc9b5_100%)]">
      <Decorations kind="stars" />
      <span
        aria-hidden="true"
        className="absolute top-5 left-6 size-11 rounded-full bg-[#fff1d6] shadow-[0_0_30px_rgba(255,214,230,0.75)]"
      />
      <div
        className={cn(
          "relative flex flex-col items-center text-center",
          compact ? "px-6 pt-14" : "px-7 pt-16",
        )}
      >
        <Sections
          ctx={ctx}
          className={cn("w-full items-center", compact ? "gap-3" : "gap-4")}
          itemClassName="w-full [&_h1]:font-hand [&_h1]:text-6xl [&_h1]:font-bold [&_h1]:leading-none [&_h1]:[text-shadow:0_0_22px_rgba(255,143,177,0.75)] [&_h2]:font-hand [&_h2]:text-4xl [&_footer]:items-center [&_footer]:border-t-0"
        />
      </div>
      <svg aria-hidden="true" viewBox="0 0 400 150" className="relative mt-4 block w-full">
        <path
          d="M0 62 C 50 40, 110 44, 160 56 S 290 28, 400 52 L 400 150 L 0 150 Z"
          fill="#c98bc0"
          opacity="0.85"
        />
        <path
          d="M0 84 C 60 56, 120 62, 180 78 S 300 48, 400 72 L 400 150 L 0 150 Z"
          fill="#8f72bd"
        />
        <path
          d="M0 116 C 70 98, 140 108, 210 112 S 330 96, 400 110 L 400 150 L 0 150 Z"
          fill="#4a3a80"
        />
        {flowers.map(([x, stem, r]) => (
          <g key={x} transform={`translate(${x} ${120 - stem})`}>
            <path d={`M0 0 L0 ${stem}`} stroke="#3d5a2a" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse
              cx={-r * 0.9}
              cy={stem * 0.55}
              rx={r * 0.7}
              ry={r * 0.26}
              fill="#2f6b3a"
              transform={`rotate(-24 ${-r * 0.9} ${stem * 0.55})`}
            />
            <ellipse
              cx={r * 0.9}
              cy={stem * 0.4}
              rx={r * 0.7}
              ry={r * 0.26}
              fill="#2f6b3a"
              transform={`rotate(24 ${r * 0.9} ${stem * 0.4})`}
            />
            {[0, 90, 180, 270].map((angle) => (
              <ellipse
                key={angle}
                cx="0"
                cy={-r * 0.62}
                rx={r * 0.5}
                ry={r * 0.66}
                fill={petal}
                stroke={edge}
                strokeWidth="1"
                transform={`rotate(${angle})`}
              />
            ))}
            <circle r={r * 0.32} fill="#ffd75a" stroke="#e9a21f" strokeWidth="0.8" />
          </g>
        ))}
      </svg>
    </article>
  );
}

/** Grid paper, polaroid photos with tape, golden timeline dots. */
function ScrapbookDesign(ctx: Ctx) {
  const { compact, style, eyebrow, animate } = ctx;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl [background:var(--t-bg)]",
        compact ? "p-3" : "p-4",
      )}
    >
      <Pattern kind="grid" opacity={0.5} />
      <Decorations kind="stars" />
      <div className="relative flex flex-col gap-4">
        <Eyebrow text={eyebrow} className="px-2 pt-1" />
        <Sections
          ctx={ctx}
          animate={animate}
          className={compact ? "gap-4" : "gap-5"}
          itemClassName={cn(
            "relative rounded-lg bg-[color:var(--t-card)]/95 shadow-md before:absolute before:-top-2 before:left-1/2 before:h-5 before:w-20 before:-translate-x-1/2 before:rotate-[-3deg] before:rounded-sm before:bg-[color:var(--glow)]/70 before:content-[''] [&_ol]:border-[color:var(--glow)]/60 [&_ol_.dot]:bg-[color:var(--glow)]",
            compact ? "p-5" : "p-6",
          )}
        />
        <Illustration
          src={style.illustration}
          className={cn("mx-auto pt-2", compact ? "max-w-56" : "max-w-sm")}
        />
      </div>
    </div>
  );
}

/**
 * A poster for a win: the trophy bird as the hero in a band of rays and
 * confetti, the name in a boxed label, condensed poster type that fits the
 * card at any length, heavy rules, and the mark at the foot.
 */
function BoldDesign(ctx: Ctx) {
  const { compact, style, eyebrow } = ctx;
  return (
    <article className="relative overflow-hidden rounded-3xl border-[3px] border-[color:var(--t-fg)] bg-[color:var(--t-card)]">
      <div
        aria-hidden="true"
        className={cn(
          "relative overflow-hidden [background:var(--t-bg)]",
          compact ? "h-24" : "h-32",
        )}
      >
        <Pattern kind="rays" opacity={0.5} />
        <Decorations kind="confetti" />
      </div>
      <Pattern kind="paper" opacity={0.1} />
      <div
        className={cn("relative flex flex-col", compact ? "-mt-16 gap-5 p-6" : "-mt-20 gap-6 p-8")}
      >
        <Illustration
          src={style.illustration}
          className={cn("mx-auto", compact ? "max-w-52" : "max-w-xs")}
        />
        <span className="inline-flex w-fit bg-[color:var(--t-fg)] px-3 py-1 text-xs font-black tracking-widest text-[color:var(--t-card)] uppercase">
          {eyebrow}
        </span>
        <Sections
          ctx={ctx}
          className={compact ? "gap-5" : "gap-6"}
          // Condensed poster type: a long word like "Congratulations" fits the card in one line.
          itemClassName="[&_h1]:font-poster [&_h1]:text-[2.75rem] [&_h1]:font-normal [&_h1]:leading-[0.92] [&_h1]:tracking-[0.02em] [&_h1]:text-[color:var(--t-accent)] [&_h2]:font-poster [&_h2]:text-4xl [&_h2]:font-normal [&_h2]:tracking-[0.02em] [&_p.msg]:text-xl [&_p.msg]:font-medium [&_footer]:border-t-[3px] [&_footer]:border-[color:var(--t-fg)] [&_.sig]:font-poster [&_.sig]:text-3xl [&_.sig]:tracking-[0.04em]"
        />
        <div className="flex items-end justify-between gap-4 border-t-[3px] border-[color:var(--t-fg)] pt-4">
          <span aria-hidden="true" className="pattern-stripes h-3 flex-1 opacity-70" />
          <CardMark />
        </div>
      </div>
    </article>
  );
}
