import { ImagePlus, MessageCircleQuestion } from "lucide-react";
import type { MediaItem, Section, ThemeVariant } from "@/features/gifts/schemas";
import type { Decoration, Design, TemplateStyle } from "@/features/gifts/templates";
import { cn } from "@/lib/utils";
import { palettes } from "./palettes";

type Labels = { forName: string; forYou: string; addPhoto: string; questionNote: string };

type Props = {
  sections: Section[];
  media: Record<string, MediaItem>;
  variant: ThemeVariant;
  style: TemplateStyle;
  recipientName: string;
  senderName: string;
  /** Smaller type and spacing for editor and dashboard previews. */
  compact?: boolean;
  /** Show dashed boxes where photos are missing. Editor only. */
  placeholders?: boolean;
  /** Staggered entrance animation for the receiver page. */
  animate?: boolean;
  /**
   * Questions are answered in the reply form under the gift. "preview" shows a
   * static card in place (editor and dashboard); "hidden" drops them (receiver).
   */
  questionMode?: "preview" | "hidden";
  /** Labels the renderer needs; passed in so this stays a server-safe component. */
  labels: Labels;
};

/**
 * Renders any gift from its sections. Each template has a design that sets
 * the frame, heading treatment, background pattern and how sections dress,
 * so a postcard looks like a postcard and a memory page like a scrapbook.
 */
export function GiftRenderer(props: Props) {
  const { sections, style, variant, recipientName, questionMode = "preview", labels } = props;
  const name = recipientName.trim();
  const eyebrow = name ? labels.forName.replace("{name}", name) : labels.forYou;
  const visible = questionMode === "hidden" ? sections.filter((s) => s.type !== "question") : sections;
  const ctx: Ctx = { ...props, design: style.design, eyebrow, visible };

  const frame = (
    <div style={palettes[variant]} className="relative text-[color:var(--t-fg)]">
      {renderDesign(ctx)}
    </div>
  );
  return frame;
}

type Ctx = Props & { design: Design; eyebrow: string; visible: Section[] };

function renderDesign(ctx: Ctx) {
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
    case "minimal":
    default:
      return <MinimalDesign {...ctx} />;
  }
}

// Shared pieces ---------------------------------------------------------------

function Sections({ ctx, className, itemClassName, animate }: { ctx: Ctx; className?: string; itemClassName?: string; animate?: boolean }) {
  return (
    <div className={cn("flex flex-col", className)}>
      {ctx.visible.map((section, i) => (
        <div
          key={section.id}
          style={animate ? { animationDelay: `${Math.min(i, 6) * 120}ms` } : undefined}
          className={cn(itemClassName, animate && "animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700")}
        >
          <SectionView ctx={ctx} section={section} isFirst={i === 0} />
        </div>
      ))}
    </div>
  );
}

function Illustration({ src, className }: { src: string; className?: string }) {
  return (
    <div className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset, optimiser bypassed on purpose */}
      <img src={src} alt="" width={1200} height={800} loading="lazy" decoding="async" className="float-slow h-auto w-full select-none" draggable={false} />
    </div>
  );
}

function Pattern({ kind, opacity = 0.35 }: { kind: "dots" | "stripes" | "lines" | "grid" | "rays"; opacity?: number }) {
  return <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", `pattern-${kind}`)} style={{ opacity }} />;
}

function Eyebrow({ text, className }: { text: string; className?: string }) {
  return <p className={cn("text-xs font-semibold tracking-[0.2em] uppercase text-[color:var(--t-muted)]", className)}>{text}</p>;
}

// Designs ---------------------------------------------------------------------

/** A real postcard: message on the left, stamp and address lines on the right. */
function PostcardDesign(ctx: Ctx) {
  const { compact, style, eyebrow } = ctx;
  return (
    <article className="relative overflow-hidden rounded-2xl border-[6px] border-[color:var(--t-card)] shadow-[0_1px_0_rgba(0,0,0,0.06)] [background:var(--t-bg)]">
      <Pattern kind="dots" opacity={0.25} />
      <Decorations kind="petals" />
      <div className={cn("relative grid rounded-xl bg-[color:var(--t-card)]/92", compact ? "gap-5 p-5 sm:grid-cols-[3fr_2fr]" : "gap-7 p-6 sm:grid-cols-[3fr_2fr] sm:p-9")}>
        <Sections ctx={ctx} className={compact ? "gap-4" : "gap-6"} />
        <aside className="flex flex-col gap-5 border-t border-dashed border-[color:var(--t-accent-soft)] pt-5 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
          <div className="self-end rounded-md border-2 border-dashed border-[color:var(--t-deco)] bg-[color:var(--t-accent-soft)]/40 p-1.5">
            <Illustration src={style.illustration} className={compact ? "w-24" : "w-32"} />
            <p className="mt-1 text-center font-display text-[10px] font-semibold tracking-[0.3em] uppercase text-[color:var(--t-muted)]">Eain</p>
          </div>
          <div className="mt-auto flex flex-col gap-4">
            <Eyebrow text={eyebrow} className="text-[color:var(--t-accent)]" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-px w-full bg-[color:var(--t-accent-soft)]" />
            ))}
          </div>
        </aside>
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
      <div className={cn("relative flex flex-col items-center text-center", compact ? "gap-4 px-4 pt-4 pb-5" : "gap-6 px-5 pt-6 pb-8 sm:px-8")}>
        <Illustration src={style.illustration} className={compact ? "max-w-56" : "max-w-sm"} />
        <div className={cn("w-full rounded-2xl bg-[color:var(--t-accent)] text-white shadow-lg", compact ? "px-5 py-4" : "px-7 py-6")}>
          <Eyebrow text={eyebrow} className="text-white/80" />
          <div className="mt-1 [&_h1]:text-white [&_h2]:text-white [&_p]:text-white/90 [&_span]:text-white">
            <Sections ctx={coverCtx} />
          </div>
        </div>
        <Sections
          ctx={restCtx}
          animate={animate}
          className={cn("w-full text-left", compact ? "gap-3" : "gap-4")}
          itemClassName={cn("rounded-2xl border-l-[6px] border-[color:var(--t-accent)] bg-[color:var(--t-card)] shadow-sm", compact ? "p-4" : "p-5 sm:p-6")}
        />
      </div>
    </div>
  );
}

/** Hairlines, centred serif and a gold inner ring. */
function ElegantDesign(ctx: Ctx) {
  const { compact, style, eyebrow, animate } = ctx;
  return (
    <div className={cn("relative overflow-hidden rounded-3xl [background:var(--t-bg)]", compact ? "p-3" : "p-4 sm:p-6")}>
      <Decorations kind="hearts" />
      <div className={cn("relative flex flex-col items-center rounded-2xl bg-[color:var(--t-card)]/92 text-center ring-1 ring-[color:var(--glow)]/70 ring-offset-4 ring-offset-[color:var(--t-card)]", compact ? "gap-5 p-6" : "gap-7 p-8 sm:p-12")}>
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
    <div className={cn("relative overflow-hidden rounded-[2rem] [background:var(--t-bg)]", compact ? "p-3" : "p-4 sm:p-5")}>
      <Decorations kind="sparkles" />
      <div className={cn("relative flex flex-col rounded-[1.6rem] border-[3px] border-dashed border-[color:var(--t-accent)]/60 bg-[color:var(--t-card)]/92", compact ? "gap-5 p-5" : "gap-7 p-7 sm:p-9")}>
        <span className="inline-flex w-fit -rotate-2 rounded-full bg-[color:var(--t-accent)] px-3 py-1 text-xs font-bold tracking-wide text-white uppercase">{eyebrow}</span>
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
      <div className={cn("relative m-2 flex flex-col rounded-[1.25rem] border-t-8 border-[color:var(--t-deco)] bg-[color:var(--t-card)]/94 sm:m-3", compact ? "gap-5 p-6" : "gap-7 p-8 sm:p-10")}>
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
      <div className={cn("relative flex flex-col items-center rounded-lg border border-[color:var(--glow)]/60 bg-[color:var(--t-card)]/94 text-center", compact ? "gap-5 p-6" : "gap-7 p-8 sm:p-12")}>
        <span aria-hidden="true" className="absolute top-4 right-4 grid size-14 place-items-center rounded-full bg-[color:var(--glow)] font-display text-[9px] font-bold tracking-[0.2em] text-[color:var(--t-fg)] shadow-md sm:size-16">
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
      <div className={cn("relative -mt-6 mx-2 mb-2 rounded-xl bg-[color:var(--t-card)]/95 shadow-md sm:mx-3 sm:mb-3", compact ? "p-6" : "p-8 sm:p-10")}>
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
    <article className={cn("relative flex flex-col overflow-hidden rounded-3xl border border-[color:var(--t-accent-soft)] bg-[color:var(--t-card)]", compact ? "gap-5 p-6" : "gap-7 p-8 sm:p-12")}>
      <Eyebrow text={eyebrow} />
      <Sections ctx={ctx} className={compact ? "gap-5" : "gap-7"} />
      <Illustration src={style.illustration} className={cn("ml-auto", compact ? "max-w-36" : "max-w-52")} />
    </article>
  );
}

/** Grid paper, polaroid photos with tape, golden timeline dots. */
function ScrapbookDesign(ctx: Ctx) {
  const { compact, style, eyebrow, animate } = ctx;
  return (
    <div className={cn("relative overflow-hidden rounded-3xl [background:var(--t-bg)]", compact ? "p-3" : "p-4 sm:p-6")}>
      <Pattern kind="grid" opacity={0.5} />
      <Decorations kind="stars" />
      <div className="relative flex flex-col gap-4">
        <Eyebrow text={eyebrow} className="px-2 pt-1" />
        <Sections
          ctx={ctx}
          animate={animate}
          className={compact ? "gap-4" : "gap-5"}
          itemClassName={cn("relative rounded-lg bg-[color:var(--t-card)]/95 shadow-md before:absolute before:-top-2 before:left-1/2 before:h-5 before:w-20 before:-translate-x-1/2 before:rotate-[-3deg] before:rounded-sm before:bg-[color:var(--glow)]/70 before:content-[''] [&_ol]:border-[color:var(--glow)]/60 [&_ol_span]:bg-[color:var(--glow)]", compact ? "p-5" : "p-6 sm:p-8")}
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
      <div className={cn("relative flex flex-col", compact ? "-mt-10 gap-5 p-6" : "-mt-12 gap-7 p-8 sm:p-10")}>
        <Illustration src={style.illustration} className={cn("mx-auto", compact ? "max-w-52" : "max-w-xs")} />
        <span className="inline-flex w-fit border-2 border-[color:var(--t-fg)] px-3 py-1 text-xs font-black tracking-widest uppercase">{eyebrow}</span>
        <Sections
          ctx={ctx}
          className={compact ? "gap-5" : "gap-7"}
          itemClassName="[&_h1]:font-sans [&_h1]:text-5xl [&_h1]:font-black [&_h1]:uppercase [&_h1]:leading-[0.95] [&_h1]:tracking-tight [&_h1]:text-[color:var(--t-accent)] sm:[&_h1]:text-6xl [&_h2]:font-sans [&_h2]:font-black [&_h2]:uppercase [&_footer]:border-t-[3px] [&_footer]:border-[color:var(--t-fg)] [&_.sig]:font-sans [&_.sig]:font-black [&_.sig]:uppercase"
        />
      </div>
    </article>
  );
}

// Sections --------------------------------------------------------------------

function SectionView({ ctx, section, isFirst }: { ctx: Ctx; section: Section; isFirst: boolean }) {
  const { media, senderName, compact, placeholders, labels, design } = ctx;
  switch (section.type) {
    case "question":
      return (
        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-[color:var(--t-accent-soft)] p-4 text-left">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-[color:var(--t-muted)]">
            <MessageCircleQuestion className="size-4" />
            {labels.questionNote}
          </p>
          <p className="font-semibold">{section.content.prompt || "…"}</p>
          {section.content.options.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {section.content.options.map((o) => (
                <span key={o.id} className="rounded-full border border-[color:var(--t-accent-soft)] px-3 py-1 text-sm">
                  {o.label}
                </span>
              ))}
            </div>
          )}
          {section.content.kind === "rating" && (
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className="grid size-8 place-items-center rounded-full border border-[color:var(--t-accent-soft)] text-sm">
                  {n}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    case "text": {
      const Heading = isFirst ? "h1" : "h2";
      return (
        <header className="flex flex-col gap-2">
          <Heading className={cn("font-display font-semibold text-balance leading-tight", compact ? (isFirst ? "text-3xl" : "text-2xl") : isFirst ? "text-4xl sm:text-5xl" : "text-3xl")}>
            {section.content.heading}
          </Heading>
          {section.content.subheading && <p className={cn("text-[color:var(--t-muted)]", compact ? "text-sm" : "text-lg")}>{section.content.subheading}</p>}
        </header>
      );
    }
    case "message":
      return <p className={cn("msg whitespace-pre-line text-[color:var(--t-fg)]/90", compact ? "text-base" : "text-lg")}>{section.content.text}</p>;
    case "image": {
      const item = section.content.mediaId ? media[section.content.mediaId] : undefined;
      if (!item) return placeholders ? <PhotoPlaceholder label={labels.addPhoto} polaroid={design === "scrapbook"} /> : null;
      const img = (
        // eslint-disable-next-line @next/next/no-img-element -- private signed URL, optimiser bypassed on purpose
        <img src={item.url} alt={section.content.caption || ""} width={item.width ?? undefined} height={item.height ?? undefined} loading="lazy" decoding="async" className={cn("w-full object-cover", design === "scrapbook" ? "aspect-square" : design === "playful" ? "rounded-3xl" : "rounded-2xl")} />
      );
      if (design === "scrapbook") {
        return (
          <figure className="mx-auto w-fit max-w-full -rotate-1 rounded-sm bg-white p-3 pb-10 shadow-lg">
            {img}
            {section.content.caption && <figcaption className="mt-3 text-center font-hand text-xl text-neutral-700">{section.content.caption}</figcaption>}
          </figure>
        );
      }
      return (
        <figure className="flex flex-col gap-2">
          {img}
          {section.content.caption && <figcaption className="text-center text-sm text-[color:var(--t-muted)]">{section.content.caption}</figcaption>}
        </figure>
      );
    }
    case "photo_grid": {
      const items = section.content.mediaIds.map((id) => media[id]).filter((m): m is MediaItem => Boolean(m));
      if (items.length === 0) return placeholders ? <PhotoPlaceholder label={labels.addPhoto} polaroid={design === "scrapbook"} /> : null;
      if (design === "scrapbook") {
        return (
          <figure className="flex flex-col gap-3">
            <div className="flex flex-wrap justify-center gap-4">
              {items.map((item, i) => (
                <div key={item.id} className={cn("w-[44%] rounded-sm bg-white p-2 pb-6 shadow-md", i % 2 ? "rotate-2" : "-rotate-2")}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- private signed URL */}
                  <img src={item.thumbUrl} alt="" loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
                </div>
              ))}
            </div>
            {section.content.caption && <figcaption className="text-center font-hand text-xl">{section.content.caption}</figcaption>}
          </figure>
        );
      }
      return (
        <figure className="flex flex-col gap-2">
          <div className={cn("grid gap-2", items.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
            {items.map((item) => (
              // eslint-disable-next-line @next/next/no-img-element -- private signed URL, optimiser bypassed on purpose
              <img key={item.id} src={item.thumbUrl} alt="" loading="lazy" decoding="async" className="aspect-square w-full rounded-xl object-cover" />
            ))}
          </div>
          {section.content.caption && <figcaption className="text-center text-sm text-[color:var(--t-muted)]">{section.content.caption}</figcaption>}
        </figure>
      );
    }
    case "timeline":
      return (
        <ol className="relative flex flex-col gap-5 border-l-2 border-[color:var(--t-accent-soft)] pl-5 text-left">
          {section.content.items.map((item, i) => (
            <li key={i} className="relative">
              <span aria-hidden="true" className="absolute top-1.5 -left-[1.6rem] size-3 rounded-full bg-[color:var(--t-accent)] ring-4 ring-[color:var(--t-card)]" />
              {item.date && <p className="text-xs font-semibold tracking-wide uppercase text-[color:var(--t-muted)]">{item.date}</p>}
              <p className="font-semibold">{item.title}</p>
              {item.text && <p className="mt-1 text-sm text-[color:var(--t-fg)]/85">{item.text}</p>}
            </li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote className="flex flex-col gap-2 border-l-4 border-[color:var(--t-accent)] pl-4">
          <p className={cn("font-display text-balance italic", compact ? "text-lg" : "text-2xl")}>“{section.content.text}”</p>
          {section.content.attribution && <footer className="text-sm text-[color:var(--t-muted)]">— {section.content.attribution}</footer>}
        </blockquote>
      );
    case "final_message": {
      const signature = section.content.signature.trim() || senderName;
      if (!section.content.text && !signature) return null;
      return (
        <footer className="flex flex-col gap-1 border-t border-[color:var(--t-accent-soft)] pt-5">
          {section.content.text && <p className="text-[color:var(--t-fg)]/85">{section.content.text}</p>}
          {signature && <p className="sig font-display text-xl font-semibold">{signature}</p>}
        </footer>
      );
    }
  }
}

function PhotoPlaceholder({ label, polaroid }: { label: string; polaroid?: boolean }) {
  return (
    <div className={cn("flex aspect-[4/3] flex-col items-center justify-center gap-2 border-2 border-dashed border-[color:var(--t-accent-soft)] text-[color:var(--t-muted)]", polaroid ? "mx-auto w-2/3 -rotate-1 rounded-sm bg-white/60" : "rounded-2xl")}>
      <ImagePlus className="size-6" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/** Purely visual scatter. Reads --t-deco and --glow from the palette. */
function Decorations({ kind }: { kind: Decoration }) {
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
