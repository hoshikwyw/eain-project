import { flowerSwatch } from "@/features/gifts/scene";
import { cn } from "@/lib/utils";
import { Decorations, Eyebrow, Illustration, Pattern, partyColor } from "./gift-decorations";
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
        <path key={`s${b.c}`} d={`M${b.cx} ${b.cy + b.ry + 3} Q${b.cx + 6} ${(b.cy + 120) / 2} 45 120`} fill="none" strokeWidth="1.2" style={{ stroke: "var(--t-muted)" }} />
      ))}
      {balloons.map((b) => (
        <g key={b.c}>
          <ellipse cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} style={{ fill: partyColor(b.c) }} />
          <path d={`M${b.cx - 3} ${b.cy + b.ry + 3} L${b.cx} ${b.cy + b.ry - 1} L${b.cx + 3} ${b.cy + b.ry + 3} Z`} style={{ fill: partyColor(b.c) }} />
          <ellipse cx={b.cx - b.rx * 0.38} cy={b.cy - b.ry * 0.4} rx={b.rx * 0.22} ry={b.ry * 0.3} fill="#fff" opacity="0.45" />
        </g>
      ))}
    </svg>
  );
}

/** A postcard with an airmail frame: message on the left, balloons, stamp and address lines on the right. */
function PostcardDesign(ctx: Ctx) {
  const { compact, style, eyebrow } = ctx;
  return (
    <article className="relative overflow-hidden rounded-2xl p-2 shadow-[0_1px_0_rgba(0,0,0,0.06)] [background:repeating-linear-gradient(135deg,var(--t-c1,var(--t-accent))_0_14px,var(--t-card)_14px_28px,var(--t-c3,var(--t-deco))_28px_42px,var(--t-card)_42px_56px)]">
      <div className="relative overflow-hidden rounded-xl [background:var(--t-bg)]">
        <Decorations kind={style.decoration} />
        <Bunting count={compact ? 11 : 15} />
        <div
          className={cn(
            "relative m-3 grid rounded-xl bg-[color:var(--t-card)]/90 shadow-sm",
            compact ? "gap-5 p-5" : "gap-7 p-6",
          )}
        >
          <Sections ctx={ctx} className={compact ? "gap-4" : "gap-6"} itemClassName={rainbowHeading} />
          <aside className="flex flex-col gap-5 border-t border-dashed border-[color:var(--t-accent-soft)] pt-5">
            <div className="flex items-start justify-end gap-2">
              <Balloons className={cn("float-slow", compact ? "w-11" : "w-16")} />
              <div className="rounded-md border-2 border-dashed border-[color:var(--t-deco)] bg-[color:var(--t-accent-soft)]/40 p-1.5">
                <Illustration src={style.illustration} className={compact ? "w-24" : "w-32"} />
                <p className="mt-1 text-center font-display text-[10px] font-semibold tracking-[0.3em] uppercase text-[color:var(--t-muted)]">Eain</p>
              </div>
            </div>
            <div className="mt-auto flex flex-col gap-4">
              <Eyebrow text={eyebrow} className="text-[color:var(--t-accent)]" />
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-px w-full" style={{ background: partyColor(i + 1), opacity: 0.45 }} />
              ))}
            </div>
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
      <div className={cn("relative flex flex-col items-center text-center", compact ? "gap-4 px-4 pt-4 pb-5" : "gap-6 px-5 pt-6 pb-8")}>
        <Illustration src={style.illustration} className={compact ? "max-w-56" : "max-w-sm"} />
        <div className={cn("w-full rounded-2xl bg-[color:var(--t-accent)] text-[color:var(--t-on-accent,#fff)] shadow-lg", compact ? "px-5 py-4" : "px-7 py-6")}>
          <Eyebrow text={eyebrow} className="text-[color:var(--t-on-accent,#fff)] opacity-80" />
          <div className="mt-1 [&_h1]:text-[color:var(--t-on-accent,#fff)] [&_h2]:text-[color:var(--t-on-accent,#fff)] [&_p]:text-[color:var(--t-on-accent,#fff)] [&_span]:text-[color:var(--t-on-accent,#fff)]">
            <Sections ctx={coverCtx} />
          </div>
        </div>
        <Sections
          ctx={restCtx}
          animate={animate}
          className={cn("w-full text-left", compact ? "gap-3" : "gap-4")}
          itemClassName={cn("rounded-2xl border-l-[6px] border-[color:var(--t-accent)] bg-[color:var(--t-card)] shadow-sm", compact ? "p-4" : "p-5")}
        />
      </div>
    </div>
  );
}

/** Hairlines, centred serif and a gold inner ring. */
function ElegantDesign(ctx: Ctx) {
  const { compact, style, eyebrow, animate } = ctx;
  return (
    <div className={cn("relative overflow-hidden rounded-3xl [background:var(--t-bg)]", compact ? "p-3" : "p-4")}>
      <Decorations kind="hearts" />
      <div className={cn("relative flex flex-col items-center rounded-2xl bg-[color:var(--t-card)]/92 text-center ring-1 ring-[color:var(--glow)]/70 ring-offset-4 ring-offset-[color:var(--t-card)]", compact ? "gap-5 p-6" : "gap-7 p-8")}>
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

/** Handwritten heading, dashed sticker border, speech-bubble messages. */
function PlayfulDesign(ctx: Ctx) {
  const { compact, style, eyebrow } = ctx;
  return (
    <div className={cn("relative overflow-hidden rounded-[2rem] [background:var(--t-bg)]", compact ? "p-3" : "p-4")}>
      <Decorations kind="sparkles" />
      <div className={cn("relative flex flex-col rounded-[1.6rem] border-[3px] border-dashed border-[color:var(--t-accent)]/60 bg-[color:var(--t-card)]/92", compact ? "gap-5 p-5" : "gap-7 p-7")}>
        <span className="inline-flex w-fit -rotate-2 rounded-full bg-[color:var(--t-accent)] px-3 py-1 text-xs font-bold tracking-wide text-[color:var(--t-on-accent,#fff)] uppercase">{eyebrow}</span>
        <Illustration src={style.illustration} className={cn("mx-auto", compact ? "max-w-52" : "max-w-xs")} />
        <Sections
          ctx={ctx}
          className={compact ? "gap-4" : "gap-6"}
          itemClassName="[&_h1]:font-hand [&_h1]:text-5xl [&_h1]:font-bold [&_h1]:leading-none [&_h1]:text-[color:var(--t-accent)] [&_h2]:font-hand [&_h2]:text-4xl [&_p.msg]:rounded-3xl [&_p.msg]:bg-[color:var(--t-accent-soft)] [&_p.msg]:px-5 [&_p.msg]:py-4 [&_.sig]:font-hand [&_.sig]:text-3xl"
        />
      </div>
    </div>
  );
}

/** Paper card with a leaf band and ornaments around the heading. */
function BotanicalDesign(ctx: Ctx) {
  const { compact, style, eyebrow } = ctx;
  return (
    <article className="relative overflow-hidden rounded-3xl [background:var(--t-bg)]">
      <Decorations kind="leaves" />
      <div className={cn("relative m-2 flex flex-col rounded-[1.25rem] border-t-8 border-[color:var(--t-deco)] bg-[color:var(--t-card)]/94", compact ? "gap-5 p-6" : "gap-7 p-8")}>
        <Eyebrow text={eyebrow} />
        <Sections
          ctx={ctx}
          className={compact ? "gap-5" : "gap-7"}
          itemClassName="[&_h1]:before:mr-3 [&_h1]:before:text-[color:var(--t-deco)] [&_h1]:before:content-['❦'] [&_h1]:after:ml-3 [&_h1]:after:text-[color:var(--t-deco)] [&_h1]:after:content-['❦']"
        />
        <Illustration src={style.illustration} className={cn("mx-auto", compact ? "max-w-56" : "max-w-sm")} />
      </div>
    </article>
  );
}

/** Double border, small caps, a seal in the corner. */
function CertificateDesign(ctx: Ctx) {
  const { compact, style, eyebrow } = ctx;
  return (
    <article className={cn("relative overflow-hidden rounded-xl border-4 border-double border-[color:var(--glow)] [background:var(--t-bg)]", compact ? "p-2" : "p-3")}>
      <Decorations kind="sparkles" />
      <div className={cn("relative flex flex-col items-center rounded-lg border border-[color:var(--glow)]/60 bg-[color:var(--t-card)]/94 text-center", compact ? "gap-5 p-6" : "gap-7 p-8")}>
        <span aria-hidden="true" className="absolute top-4 right-4 grid size-14 place-items-center rounded-full bg-[color:var(--glow)] font-display text-[9px] font-bold tracking-[0.2em] text-[color:var(--t-fg)] shadow-md">
          ✦ EAIN
        </span>
        <Eyebrow text={eyebrow} className="tracking-[0.3em]" />
        <Sections
          ctx={ctx}
          className={cn("w-full items-center", compact ? "gap-5" : "gap-7")}
          itemClassName="w-full [&_h1]:uppercase [&_h1]:tracking-wide [&_h1]:font-bold [&_h1]:after:mx-auto [&_h1]:after:mt-4 [&_h1]:after:block [&_h1]:after:h-1 [&_h1]:after:w-24 [&_h1]:after:rounded-full [&_h1]:after:bg-[color:var(--glow)] [&_h1]:after:content-[''] [&_footer]:items-center [&_footer]:border-t-0"
        />
        <Illustration src={style.illustration} className={compact ? "max-w-52" : "max-w-xs"} />
      </div>
    </article>
  );
}

/** Lined paper under an envelope flap, handwritten message. */
function LetterDesign(ctx: Ctx) {
  const { compact, style, eyebrow } = ctx;
  return (
    <div className="relative overflow-hidden rounded-3xl [background:var(--t-bg)]">
      <Decorations kind="stars" />
      <div aria-hidden="true" className="relative h-14 bg-[color:var(--t-accent-soft)] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
      <div className={cn("relative -mt-6 mx-2 mb-2 rounded-xl bg-[color:var(--t-card)]/95 shadow-md", compact ? "p-6" : "p-8")}>
        <Pattern kind="lines" opacity={0.6} />
        <div className={cn("relative flex flex-col", compact ? "gap-5" : "gap-7")}>
          <Eyebrow text={eyebrow} className="font-hand text-lg normal-case tracking-normal" />
          <Sections
            ctx={ctx}
            className={compact ? "gap-5" : "gap-7"}
            itemClassName="[&_h1]:font-hand [&_h1]:text-5xl [&_h1]:font-bold [&_h1]:leading-none [&_p.msg]:font-hand [&_p.msg]:text-2xl [&_p.msg]:leading-[2rem] [&_.sig]:font-hand [&_.sig]:text-3xl"
          />
          <Illustration src={style.illustration} className={cn("ml-auto", compact ? "max-w-40" : "max-w-56")} />
        </div>
      </div>
    </div>
  );
}

/** Clean white card, plenty of air, a small illustration. */
function MinimalDesign(ctx: Ctx) {
  const { compact, style, eyebrow } = ctx;
  return (
    <article className={cn("relative flex flex-col overflow-hidden rounded-3xl border border-[color:var(--t-accent-soft)] bg-[color:var(--t-card)]", compact ? "gap-5 p-6" : "gap-7 p-8")}>
      <Eyebrow text={eyebrow} />
      <Sections ctx={ctx} className={compact ? "gap-5" : "gap-7"} />
      <Illustration src={style.illustration} className={cn("ml-auto", compact ? "max-w-36" : "max-w-52")} />
    </article>
  );
}

/**
 * An empty card: the look's background as a thin frame, the card, and the
 * creator's sections. No label, illustration or decoration, so everything on
 * it is theirs. Tall enough when nearly empty to leave room for stickers.
 */
function BlankDesign(ctx: Ctx) {
  const { compact } = ctx;
  return (
    <article className={cn("relative overflow-hidden rounded-3xl [background:var(--t-bg)]", compact ? "p-2" : "p-3")}>
      <div className={cn("relative flex min-h-[26rem] flex-col rounded-[1.25rem] bg-[color:var(--t-card)]", compact ? "gap-5 p-6" : "gap-7 p-8")}>
        <Sections ctx={ctx} className={compact ? "gap-5" : "gap-7"} />
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
    [48, 46, 15], [118, 70, 19], [200, 88, 22], [282, 66, 19], [352, 44, 15],
  ];
  return (
    <article className="relative overflow-hidden rounded-3xl [background:linear-gradient(to_bottom,#2f2560_0%,#4b3b8a_30%,#7d63b8_56%,#e59ac4_82%,#ffc9b5_100%)]">
      <Decorations kind="stars" />
      <span aria-hidden="true" className="absolute top-5 left-6 size-11 rounded-full bg-[#fff1d6] shadow-[0_0_30px_rgba(255,214,230,0.75)]" />
      <div className={cn("relative flex flex-col items-center text-center", compact ? "px-6 pt-14" : "px-7 pt-16")}>
        <Sections
          ctx={ctx}
          className={cn("w-full items-center", compact ? "gap-3" : "gap-4")}
          itemClassName="w-full [&_h1]:font-hand [&_h1]:text-6xl [&_h1]:font-bold [&_h1]:leading-none [&_h1]:[text-shadow:0_0_22px_rgba(255,143,177,0.75)] [&_h2]:font-hand [&_h2]:text-4xl [&_footer]:items-center [&_footer]:border-t-0"
        />
      </div>
      <svg aria-hidden="true" viewBox="0 0 400 150" className="relative mt-4 block w-full">
        <path d="M0 62 C 50 40, 110 44, 160 56 S 290 28, 400 52 L 400 150 L 0 150 Z" fill="#c98bc0" opacity="0.85" />
        <path d="M0 84 C 60 56, 120 62, 180 78 S 300 48, 400 72 L 400 150 L 0 150 Z" fill="#8f72bd" />
        <path d="M0 116 C 70 98, 140 108, 210 112 S 330 96, 400 110 L 400 150 L 0 150 Z" fill="#4a3a80" />
        {flowers.map(([x, stem, r]) => (
          <g key={x} transform={`translate(${x} ${120 - stem})`}>
            <path d={`M0 0 L0 ${stem}`} stroke="#3d5a2a" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx={-r * 0.9} cy={stem * 0.55} rx={r * 0.7} ry={r * 0.26} fill="#2f6b3a" transform={`rotate(-24 ${-r * 0.9} ${stem * 0.55})`} />
            <ellipse cx={r * 0.9} cy={stem * 0.4} rx={r * 0.7} ry={r * 0.26} fill="#2f6b3a" transform={`rotate(24 ${r * 0.9} ${stem * 0.4})`} />
            {[0, 90, 180, 270].map((angle) => (
              <ellipse key={angle} cx="0" cy={-r * 0.62} rx={r * 0.5} ry={r * 0.66} fill={petal} stroke={edge} strokeWidth="1" transform={`rotate(${angle})`} />
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
    <div className={cn("relative overflow-hidden rounded-3xl [background:var(--t-bg)]", compact ? "p-3" : "p-4")}>
      <Pattern kind="grid" opacity={0.5} />
      <Decorations kind="stars" />
      <div className="relative flex flex-col gap-4">
        <Eyebrow text={eyebrow} className="px-2 pt-1" />
        <Sections
          ctx={ctx}
          animate={animate}
          className={compact ? "gap-4" : "gap-5"}
          itemClassName={cn("relative rounded-lg bg-[color:var(--t-card)]/95 shadow-md before:absolute before:-top-2 before:left-1/2 before:h-5 before:w-20 before:-translate-x-1/2 before:rotate-[-3deg] before:rounded-sm before:bg-[color:var(--glow)]/70 before:content-[''] [&_ol]:border-[color:var(--glow)]/60 [&_ol_.dot]:bg-[color:var(--glow)]", compact ? "p-5" : "p-6")}
        />
        <Illustration src={style.illustration} className={cn("mx-auto pt-2", compact ? "max-w-56" : "max-w-sm")} />
      </div>
    </div>
  );
}

/** Big type, a rays band and heavy borders. */
function BoldDesign(ctx: Ctx) {
  const { compact, style, eyebrow } = ctx;
  return (
    <article className="relative overflow-hidden rounded-3xl border-[3px] border-[color:var(--t-fg)] bg-[color:var(--t-card)]">
      <div aria-hidden="true" className="relative h-24 overflow-hidden [background:var(--t-bg)]">
        <Pattern kind="rays" opacity={0.5} />
        <Decorations kind="confetti" />
      </div>
      <div className={cn("relative flex flex-col", compact ? "-mt-10 gap-5 p-6" : "-mt-12 gap-7 p-8")}>
        <Illustration src={style.illustration} className={cn("mx-auto", compact ? "max-w-52" : "max-w-xs")} />
        <span className="inline-flex w-fit border-2 border-[color:var(--t-fg)] px-3 py-1 text-xs font-black tracking-widest uppercase">{eyebrow}</span>
        <Sections
          ctx={ctx}
          className={compact ? "gap-5" : "gap-7"}
          itemClassName="[&_h1]:font-sans [&_h1]:text-5xl [&_h1]:font-black [&_h1]:uppercase [&_h1]:leading-[0.95] [&_h1]:tracking-tight [&_h1]:text-[color:var(--t-accent)] [&_h2]:font-sans [&_h2]:font-black [&_h2]:uppercase [&_footer]:border-t-[3px] [&_footer]:border-[color:var(--t-fg)] [&_.sig]:font-sans [&_.sig]:font-black [&_.sig]:uppercase"
        />
      </div>
    </article>
  );
}
