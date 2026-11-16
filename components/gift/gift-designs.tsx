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
    case "invite":
      return <InviteDesign {...ctx} />;
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

/**
 * A party invitation: bunting across the top, the bird with the cake as the
 * hero, the greeting on a ticket with notched sides and a perforated edge,
 * then the words on stacked cards, each with its own party colour along the
 * top and a slight tilt, the photo taped in, and a striped foot. Premium, so
 * no printer's mark.
 */
function PartyDesign(ctx: Ctx) {
  const { compact, style, eyebrow, animate } = ctx;
  const [cover, ...rest] = ctx.visible;
  const coverCtx = { ...ctx, visible: cover ? [cover] : [] };
  const restCtx = { ...ctx, visible: rest };
  return (
    <article className="relative overflow-hidden rounded-3xl [background:var(--t-bg)]">
      <Decorations kind="confetti" />
      <Bunting count={compact ? 8 : 10} />
      <div
        className={cn(
          "relative flex flex-col items-center text-center",
          compact ? "gap-4 px-4 pt-3 pb-5" : "gap-6 px-5 pt-4 pb-8",
        )}
      >
        <Illustration src={style.illustration} className={compact ? "max-w-52" : "max-w-72"} />
        <div className="w-full drop-shadow-lg">
          <div
            className={cn(
              "relative w-full rounded-2xl bg-[color:var(--t-accent)] text-[color:var(--t-on-accent,#fff)]",
              // Notches cut into both sides, like a ticket torn off its stub.
              "[mask:radial-gradient(12px_at_0_50%,transparent_98%,#000)_0_0/51%_100%_no-repeat,radial-gradient(12px_at_100%_50%,transparent_98%,#000)_100%_0/51%_100%_no-repeat]",
              compact ? "px-7 py-4" : "px-9 py-6",
            )}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-2 rounded-xl border border-dashed border-[color:var(--t-on-accent,#fff)]/45"
            />
            <Eyebrow text={eyebrow} className="text-[color:var(--t-on-accent,#fff)] opacity-85" />
            <div className="mt-1 [&_h1]:text-[color:var(--t-on-accent,#fff)] [&_h2]:text-[color:var(--t-on-accent,#fff)] [&_p]:text-[color:var(--t-on-accent,#fff)] [&_span]:text-[color:var(--t-on-accent,#fff)]">
              <Sections ctx={coverCtx} />
            </div>
          </div>
        </div>
        <Sections
          ctx={restCtx}
          animate={animate}
          className={cn("w-full text-left", compact ? "gap-3" : "gap-4")}
          itemClassName={cn(
            "rounded-2xl border-t-[6px] bg-[color:var(--t-card)] shadow-sm odd:rotate-[0.6deg] even:-rotate-[0.6deg]",
            // Each card takes the next party colour.
            "[&:nth-child(5n+1)]:border-[color:var(--t-c1,var(--t-accent))] [&:nth-child(5n+2)]:border-[color:var(--t-c2,var(--t-accent))] [&:nth-child(5n+3)]:border-[color:var(--t-c3,var(--t-accent))] [&:nth-child(5n+4)]:border-[color:var(--t-c4,var(--t-accent))] [&:nth-child(5n+5)]:border-[color:var(--t-c5,var(--t-accent))]",
            "[&_.sig]:text-2xl [&_.sig]:text-[color:var(--t-accent)]",
            compact ? "p-4" : "p-5",
          )}
        />
      </div>
      <div aria-hidden="true" className="pattern-stripes h-3 w-full opacity-70" />
    </article>
  );
}

/** A gold flourish: two curls meeting at a small heart. The anniversary card's divider. */
function Flourish({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 20" aria-hidden="true" className={className} fill="none">
      <path
        d="M6 10 C 28 10, 42 3, 58 10 S 70 15, 72 10"
        stroke="var(--glow)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M154 10 C 132 10, 118 3, 102 10 S 90 15, 88 10"
        stroke="var(--glow)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M80 15.5 C 73.5 11, 74.5 5.5, 78.8 7.2 C 79.6 7.5, 80 8, 80 8.2 C 80 8, 80.4 7.5, 81.2 7.2 C 85.5 5.5, 86.5 11, 80 15.5 Z"
        fill="var(--glow)"
      />
      <circle cx="6" cy="10" r="1.5" fill="var(--glow)" />
      <circle cx="154" cy="10" r="1.5" fill="var(--glow)" />
    </svg>
  );
}

/**
 * An invitation on dark card with gold foil: a double hairline frame with
 * ornaments in the corners, the name in spaced gold caps, flourishes above
 * and below the words, photos as framed prints, a gold timeline, and the
 * birds in a soft glow at the foot. Premium, so no printer's mark.
 */
function ElegantDesign(ctx: Ctx) {
  const { compact, style, eyebrow, animate } = ctx;
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-3xl [background:var(--t-bg)]",
        compact ? "p-3" : "p-4",
      )}
    >
      <Decorations kind="hearts" />
      <div
        className={cn(
          "relative flex flex-col items-center rounded-2xl bg-[color:var(--t-card)]/92 text-center ring-1 ring-[color:var(--glow)]/70",
          compact ? "gap-5 px-6 pt-7 pb-6" : "gap-7 px-8 pt-9 pb-8",
        )}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-2 rounded-xl border border-[color:var(--glow)]/35"
        />
        <CornerMark className="absolute top-3.5 left-3.5 size-5" />
        <CornerMark className="absolute top-3.5 right-3.5 size-5 rotate-90" />
        <CornerMark className="absolute right-3.5 bottom-3.5 size-5 rotate-180" />
        <CornerMark className="absolute bottom-3.5 left-3.5 size-5 -rotate-90" />
        <div className="flex flex-col items-center gap-3">
          <Eyebrow text={eyebrow} className="tracking-[0.35em] text-[color:var(--glow)]" />
          <Flourish className="w-40" />
        </div>
        <Sections
          ctx={ctx}
          animate={animate}
          className={cn("w-full items-center text-center", compact ? "gap-5" : "gap-7")}
          itemClassName={cn(
            "w-full",
            // Headings and the signature in italic serif; the signature and captions in gold.
            "[&_h1]:italic [&_h1]:font-medium [&_h2]:italic [&_h2]:font-medium [&_h2]:text-[color:var(--t-muted)]",
            "[&_p.msg]:mx-auto [&_p.msg]:max-w-[32ch] [&_p.msg]:text-lg",
            "[&_blockquote]:border-0 [&_blockquote]:pl-0 [&_blockquote_p]:font-display [&_blockquote_p]:text-xl [&_blockquote_p]:italic",
            "[&_footer]:items-center [&_footer]:border-t-0 [&_.sig]:text-2xl [&_.sig]:font-medium [&_.sig]:italic [&_.sig]:text-[color:var(--glow)]",
            // The timeline in gold, kept to the width of its words.
            "[&_ol]:mx-auto [&_ol]:w-fit [&_ol]:text-left [&_ol]:border-[color:var(--glow)]/40 [&_ol_.dot]:bg-[color:var(--glow)]",
            // Photos as framed prints: a thin gold frame around a mat of card colour.
            "[&_.grid]:gap-5 [&_figure_img]:rounded-sm [&_figure_img]:ring-1 [&_figure_img]:ring-[color:var(--glow)]/60 [&_figure_img]:ring-offset-4 [&_figure_img]:ring-offset-[color:var(--t-card)] [&_figure]:px-1",
            "[&_figcaption]:font-display [&_figcaption]:text-base [&_figcaption]:italic [&_figcaption]:text-[color:var(--glow)]",
          )}
        />
        <Flourish className="w-40" />
        <div className="relative">
          <span
            aria-hidden="true"
            className="absolute inset-4 rounded-full bg-[color:var(--t-accent)]/25 blur-2xl"
          />
          <Illustration
            src={style.illustration}
            className={cn("relative", compact ? "max-w-48" : "max-w-64")}
          />
        </div>
      </div>
    </article>
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
          itemClassName="[&_h1]:font-hand [&_h1]:text-6xl [&_h1]:font-bold [&_h1]:leading-[0.95] [&_h1]:tracking-normal [&_h1]:text-[color:var(--t-accent)] [&_h1:has([data-burmese])]:text-4xl [&_h2]:font-hand [&_h2]:text-4xl [&_h2]:text-[color:var(--t-accent)] [&_h2:has([data-burmese])]:text-2xl [&_p.msg]:relative [&_p.msg]:rounded-3xl [&_p.msg]:rounded-bl-md [&_p.msg]:bg-[color:var(--t-accent-soft)] [&_p.msg]:px-5 [&_p.msg]:py-4 [&_blockquote]:border-l-0 [&_blockquote]:pl-0 [&_blockquote_p]:font-hand [&_blockquote_p]:text-3xl [&_blockquote_p]:leading-[1.15] [&_blockquote_p]:not-italic [&_blockquote_p]:text-[color:var(--t-fg)]/85 [&_blockquote_p:has([data-burmese])]:text-xl [&_blockquote_p:has([data-burmese])]:leading-normal [&_.sig]:font-hand [&_.sig]:text-3xl [&_.sig]:text-[color:var(--t-accent)] [&_.sig:has([data-burmese])]:text-2xl"
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
            itemClassName="[&_h1]:font-hand [&_h1]:text-6xl [&_h1]:font-bold [&_h1]:leading-[0.95] [&_h1]:tracking-normal [&_h1:has([data-burmese])]:text-4xl [&_h2]:font-hand [&_h2]:text-4xl [&_h2:has([data-burmese])]:text-2xl [&_p.msg]:font-hand [&_p.msg]:text-2xl [&_p.msg]:leading-[2rem] [&_p.msg:has([data-burmese])]:text-lg [&_.sig]:font-hand [&_.sig]:text-3xl [&_.sig]:text-[color:var(--t-accent)] [&_.sig:has([data-burmese])]:text-2xl"
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

/** A fluffy pastel cloud from the Night Garden scene: white puffs over a pink underside. */
function Cloud({ className }: { className?: string }) {
  const puffs: [number, number, number][] = [
    [38, 52, 23],
    [70, 38, 29],
    [105, 42, 25],
    [132, 54, 19],
  ];
  const layer = (dy: number, fill: string) => (
    <g fill={fill}>
      {puffs.map(([cx, cy, r]) => (
        <circle key={cx} cx={cx} cy={cy + dy} r={r} />
      ))}
      <rect x="30" y={50 + dy} width="110" height="24" rx="12" />
    </g>
  );
  return (
    <svg viewBox="0 0 170 80" aria-hidden="true" className={className}>
      {layer(5, "#f2a9cc")}
      {layer(0, "#fff2f8")}
    </svg>
  );
}

/** The scene's sleepy, blushing moon with its halo. */
function Moon({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("block aspect-square", className)}>
      <span className="absolute -inset-[90%] rounded-full [background:radial-gradient(circle,rgba(255,214,230,0.45)_0%,transparent_65%)]" />
      <span className="absolute inset-0 rounded-full shadow-[inset_-6px_-4px_12px_rgba(214,140,160,0.35),0_0_24px_6px_rgba(255,214,230,0.45)] [background:radial-gradient(circle_at_35%_35%,#fffdf6_0%,#fff0d9_55%,#f6d2c6_100%)]" />
      <svg
        viewBox="-50 -50 100 100"
        className="absolute inset-0 size-full overflow-visible"
        fill="none"
        stroke="#9a6a5a"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <ellipse cx="-25" cy="10" rx="9" ry="5.5" fill="#ff9fbf" stroke="none" opacity="0.6" />
        <ellipse cx="25" cy="10" rx="9" ry="5.5" fill="#ff9fbf" stroke="none" opacity="0.6" />
        <path d="M-23 -3 Q -16 4 -9 -3" />
        <path d="M9 -3 Q 16 4 23 -3" />
        <path d="M-5 13 Q 0 17 5 13" />
      </svg>
    </span>
  );
}

/** One of the scene's flowers: five petals round a golden centre with a sleeping face. */
function GardenFlower({
  x,
  stem,
  r,
  petal,
  edge,
}: {
  x: number;
  stem: number;
  r: number;
  petal: string;
  edge: string;
}) {
  return (
    <g transform={`translate(${x} ${130 - stem})`}>
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
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx="0"
          cy={-r * 0.6}
          rx={r * 0.42}
          ry={r * 0.68}
          fill={petal}
          stroke={edge}
          strokeWidth="1"
          transform={`rotate(${angle})`}
        />
      ))}
      <circle r={r * 0.46} fill="#ffd75a" stroke="#e9a21f" strokeWidth="0.8" />
      <g fill="none" stroke="#7a4a3a" strokeWidth="1" strokeLinecap="round">
        <ellipse
          cx={-r * 0.22}
          cy={r * 0.1}
          rx={r * 0.09}
          ry={r * 0.06}
          fill="#ff8fb1"
          stroke="none"
          opacity="0.85"
        />
        <ellipse
          cx={r * 0.22}
          cy={r * 0.1}
          rx={r * 0.09}
          ry={r * 0.06}
          fill="#ff8fb1"
          stroke="none"
          opacity="0.85"
        />
        <path
          d={`M${-r * 0.26} ${-r * 0.06} Q ${-r * 0.18} ${r * 0.03} ${-r * 0.1} ${-r * 0.06}`}
        />
        <path d={`M${r * 0.1} ${-r * 0.06} Q ${r * 0.18} ${r * 0.03} ${r * 0.26} ${-r * 0.06}`} />
        <path d={`M${-r * 0.05} ${r * 0.17} Q 0 ${r * 0.23} ${r * 0.05} ${r * 0.17}`} />
      </g>
    </g>
  );
}

/**
 * Summary card of the Night Garden animation, drawn with the scene's own
 * parts: its twilight sky and horizon glow, the sleepy moon, pastel clouds,
 * fireflies, the name in glowing script with a heart, the message, and the
 * three hills with blooming flowers in the colour the creator picked. The
 * receiver sees the animation itself (public/scenes/night-garden); this is
 * its still picture. Premium, so no printer's mark.
 */
function GardenDesign(ctx: Ctx) {
  const { compact } = ctx;
  const { petal, edge } = flowerSwatch[ctx.scene?.flower ?? "white"];
  // [x, height of the stem, size of the bloom]
  const flowers: [number, number, number][] = [
    [46, 48, 17],
    [118, 74, 22],
    [200, 92, 26],
    [284, 70, 22],
    [354, 46, 17],
  ];
  const sprouts = [22, 78, 150, 240, 316, 378];
  const fireflies: [string, string][] = [
    ["9%", "52%"],
    ["24%", "61%"],
    ["55%", "56%"],
    ["78%", "64%"],
    ["90%", "47%"],
  ];
  return (
    <article className="relative overflow-hidden rounded-3xl [background:linear-gradient(to_bottom,#2f2560_0%,#4b3b8a_28%,#7d63b8_52%,#e59ac4_74%,#ffc9b5_92%)]">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_40%_at_50%_85%,rgba(255,170,200,0.45),transparent_70%),radial-gradient(70%_28%_at_18%_80%,rgba(255,214,150,0.35),transparent_70%)]"
      />
      <Decorations kind="stars" />
      <Moon className={cn("absolute left-7", compact ? "top-5 w-12" : "top-6 w-16")} />
      <Cloud className="absolute top-5 right-6 w-24 drop-shadow-[0_0_10px_rgba(255,200,225,0.45)]" />
      <Cloud className="absolute top-[58%] -left-8 w-40 opacity-90 drop-shadow-[0_0_10px_rgba(255,200,225,0.45)]" />
      <Cloud className="absolute top-[63%] -right-4 w-28 opacity-85 drop-shadow-[0_0_10px_rgba(255,200,225,0.45)]" />
      {fireflies.map(([left, top]) => (
        <span
          key={left}
          aria-hidden="true"
          style={{ left, top }}
          className="absolute size-1.5 rounded-full bg-[#ffe27a] shadow-[0_0_8px_3px_rgba(255,226,122,0.55)]"
        />
      ))}
      <div
        className={cn(
          "relative flex flex-col items-center text-center",
          compact ? "px-6 pt-20" : "px-7 pt-24",
        )}
      >
        <Sections
          ctx={ctx}
          className={cn("w-full items-center", compact ? "gap-3" : "gap-4")}
          itemClassName={cn(
            "w-full text-[#fff6ec]",
            "[&_h1]:font-hand [&_h1]:text-6xl [&_h1]:leading-none [&_h1]:font-bold [&_h1:has([data-burmese])]:text-4xl [&_h1]:[text-shadow:0_0_22px_rgba(255,143,177,0.75)] [&_h1]:after:ml-2 [&_h1]:after:align-middle [&_h1]:after:text-4xl [&_h1]:after:font-normal [&_h1]:after:text-[#ff8fb1] [&_h1]:after:content-['♡']",
            "[&_h2]:font-hand [&_h2]:text-4xl [&_h2:has([data-burmese])]:text-2xl [&_h2]:text-[#fff6ec]/90 [&_p.msg]:text-[#fff6ec]/95 [&_p.msg]:[text-shadow:0_1px_12px_rgba(47,37,96,0.7)]",
            "[&_footer]:items-center [&_footer]:border-t-0 [&_.sig]:font-hand [&_.sig]:text-3xl",
          )}
        />
      </div>
      <svg aria-hidden="true" viewBox="0 0 400 160" className="relative mt-4 block w-full">
        <defs>
          <linearGradient id="ng-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f3a6c8" />
            <stop offset="100%" stopColor="#c98bc0" />
          </linearGradient>
          <linearGradient id="ng-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a985cf" />
            <stop offset="100%" stopColor="#7c62ad" />
          </linearGradient>
          <linearGradient id="ng-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5d4a96" />
            <stop offset="100%" stopColor="#3a2d6b" />
          </linearGradient>
        </defs>
        <path
          d="M0 52 C 50 30, 110 34, 160 46 S 290 18, 400 42 L 400 160 L 0 160 Z"
          fill="url(#ng-far)"
          opacity="0.85"
        />
        <path
          d="M0 70 C 60 40, 120 45, 180 62 S 300 30, 400 55 L 400 160 L 0 160 Z"
          fill="url(#ng-back)"
        />
        <path
          d="M0 105 C 70 85, 140 95, 210 100 S 330 82, 400 98 L 400 160 L 0 160 Z"
          fill="url(#ng-front)"
        />
        {flowers.map(([x, stem, r]) => (
          <GardenFlower key={x} x={x} stem={stem} r={r} petal={petal} edge={edge} />
        ))}
        {/* Grass tufts with small blooms along the front hill. */}
        {sprouts.map((x, i) => (
          <g key={x} transform={`translate(${x} 142)`}>
            <path
              d="M-6 0 Q -5 -8 -2 -12 M0 0 Q 0 -10 1 -15 M6 0 Q 5 -8 3 -11"
              fill="none"
              stroke="#4f8a3f"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <g transform="translate(1 -16)">
              {[0, 90, 180, 270].map((a) => (
                <circle
                  key={a}
                  cx={Math.cos((a * Math.PI) / 180) * 2.8}
                  cy={Math.sin((a * Math.PI) / 180) * 2.8}
                  r="2"
                  fill={i % 2 ? petal : "#fffdf7"}
                />
              ))}
              <circle r="1.5" fill="#ffd75a" />
            </g>
          </g>
        ))}
      </svg>
    </article>
  );
}

/**
 * A scrapbook open under the night sky: cream pages tilted a little in turn,
 * each held down by a strip of washi tape (gold, then the accent), the name
 * on a label sticker, a handwritten title, photos as polaroids with corner
 * mounts, the timeline as a dotted string, and the birds under the moon at
 * the foot. Premium, so no printer's mark.
 */
function ScrapbookDesign(ctx: Ctx) {
  const { compact, style, eyebrow, animate } = ctx;
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-3xl [background:var(--t-bg)]",
        compact ? "p-3" : "p-4",
      )}
    >
      <Pattern kind="grid" opacity={0.5} />
      <Decorations kind="stars" />
      <div className="relative flex flex-col gap-5">
        <span className="ml-2 w-fit -rotate-2 rounded-md bg-[color:var(--glow)] px-3 py-1 shadow-sm">
          <Eyebrow text={eyebrow} className="text-[#3b2f2a]" />
        </span>
        <Sections
          ctx={ctx}
          animate={animate}
          className={compact ? "gap-5" : "gap-6"}
          itemClassName={cn(
            // Cream pages with their own ink, whatever the look around them.
            "relative rounded-sm bg-[color:var(--t-card)] text-[color:var(--t-fg)] shadow-md [--t-card:#fbf6ec] [--t-fg:#3b2f2a] [--t-muted:#7d6b63] odd:rotate-[-0.6deg] even:rotate-[0.6deg]",
            // Washi tape over the top edge, gold on one page and the accent on the next.
            "before:absolute before:-top-2.5 before:left-1/2 before:h-5 before:w-24 before:-translate-x-1/2 before:rounded-sm before:content-[''] odd:before:rotate-[-3deg] odd:before:bg-[color:var(--glow)]/85 even:before:rotate-[3deg] even:before:bg-[color:var(--t-accent)]/60",
            "[&_h1]:font-hand [&_h1]:text-6xl [&_h1]:leading-none [&_h1]:font-bold [&_h1:has([data-burmese])]:text-4xl [&_h2]:font-hand [&_h2]:text-3xl [&_h2:has([data-burmese])]:text-2xl",
            "[&_ol]:border-l-2 [&_ol]:border-dotted [&_ol]:border-[color:var(--t-accent)] [&_ol_.dot]:bg-[color:var(--glow)] [&_ol_.dot]:ring-[#fbf6ec]",
            "[&_footer]:border-[color:var(--t-accent)]/30 [&_.sig]:font-hand [&_.sig]:text-3xl [&_.sig]:font-bold [&_.sig:has([data-burmese])]:text-2xl",
            compact ? "p-5" : "p-6",
          )}
        />
        <Illustration
          src={style.illustration}
          className={cn("mx-auto pt-2", compact ? "max-w-56" : "max-w-sm")}
        />
      </div>
    </article>
  );
}

/** Short bars like a ticket's barcode. A fixed pattern, so server and client draw the same. */
function Barcode({ className }: { className?: string }) {
  const widths = [2, 1, 3, 1, 2, 2, 1, 3, 2, 1, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2];
  let x = 0;
  const bars = widths.map((w, i) => {
    const bar = <rect key={i} x={x} y="0" width={w} height="24" />;
    x += w + 1;
    return bar;
  });
  return (
    <svg viewBox="0 0 56 24" aria-hidden="true" className={className} fill="currentColor">
      {bars}
    </svg>
  );
}

/**
 * An invitation as a ticket: the picture as the hero, the greeting on a band
 * in the accent colour with a scalloped lower edge, the event details as the
 * centrepiece in a dashed box, the RSVP as its own card, and a perforated
 * stub at the foot with the guest's name and a little barcode. Shared by the
 * party, baby shower and graduation templates, each in its own look.
 * Premium or not, an invitation carries no printer's mark.
 */
function InviteDesign(ctx: Ctx) {
  const { compact, style, eyebrow, animate } = ctx;
  const [cover, ...rest] = ctx.visible;
  const coverCtx = { ...ctx, visible: cover ? [cover] : [] };
  const restCtx = { ...ctx, visible: rest };
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-3xl [background:var(--t-bg)]",
        compact ? "p-3" : "p-4",
      )}
    >
      <Decorations kind={style.decoration} />
      <div className="relative drop-shadow-md">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl bg-[color:var(--t-card)]",
            // The stub is torn off along a perforation: notches cut into both sides at its height.
            "[mask:radial-gradient(12px_at_0_calc(100%-3rem),transparent_98%,#000)_0_0/51%_100%_no-repeat,radial-gradient(12px_at_100%_calc(100%-3rem),transparent_98%,#000)_100%_0/51%_100%_no-repeat]",
          )}
        >
          <Pattern kind="paper" opacity={0.1} />
          <Illustration
            src={style.illustration}
            className={cn("relative mx-auto", compact ? "max-w-52 pt-3" : "max-w-64 pt-4")}
          />
          <div className="relative">
            <div
              className={cn(
                "bg-[color:var(--t-accent)] text-center text-[color:var(--t-on-accent,#fff)]",
                compact ? "px-5 pt-4 pb-8" : "px-7 pt-5 pb-10",
              )}
            >
              <div className="[&_h1]:text-[color:var(--t-on-accent,#fff)] [&_h2]:text-[color:var(--t-on-accent,#fff)] [&_p]:text-[color:var(--t-on-accent,#fff)] [&_span]:text-[color:var(--t-on-accent,#fff)]">
                <Sections ctx={coverCtx} />
              </div>
            </div>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 -bottom-px h-4 [background:radial-gradient(circle_at_50%_100%,var(--t-card)_8px,transparent_8.5px)_0_0/20px_16px_repeat-x]"
            />
          </div>
          <Sections
            ctx={restCtx}
            animate={animate}
            className={cn("relative text-left", compact ? "gap-4 p-5" : "gap-5 p-6")}
            itemClassName={cn(
              // The event details are what the card is for: boxed, the date in display type.
              "[&_.event]:border-2 [&_.event]:border-dashed [&_.event]:border-[color:var(--t-accent)]/45 [&_.event]:bg-[color:var(--t-accent-soft)]/50 [&_.event_li:first-child_p]:font-display [&_.event_li:first-child_p]:text-2xl [&_.event_li:first-child_p]:leading-tight [&_.event_li:first-child_p]:text-[color:var(--t-accent)]",
              "[&_.question]:border-2 [&_.question]:border-solid [&_.question]:border-[color:var(--t-accent)]/30",
              "[&_footer]:items-center [&_footer]:border-t-0 [&_footer]:text-center [&_.sig]:text-2xl [&_.sig]:text-[color:var(--t-accent)]",
            )}
          />
          <div className="relative flex h-12 items-center justify-between border-t-2 border-dashed border-[color:var(--t-accent)]/35 px-6">
            <Eyebrow text={eyebrow} className="text-[color:var(--t-accent)]" />
            <Barcode className="h-5 w-14 text-[color:var(--t-fg)]/70" />
          </div>
        </div>
      </div>
    </article>
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
