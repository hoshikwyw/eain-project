import { ImagePlus, MessageCircleQuestion } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { MediaItem, Section, TextStyle } from "@/features/gifts/schemas";
import { cn } from "@/lib/utils";
import type { Ctx } from "./gift-types";
import { StickerLayer } from "./sticker-layer";
import { TEXT_FONTS } from "./text-fonts";

/**
 * The creator's sections, one after the other, each with the stickers placed
 * on it. A design decides the spacing and how each section is dressed.
 */
export function Sections({
  ctx,
  className,
  itemClassName,
  animate,
}: {
  ctx: Ctx;
  className?: string;
  itemClassName?: string;
  animate?: boolean;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      {ctx.visible.map((section, i) => {
        const stickers = ctx.sectionStickers.get(section.id);
        return (
          <div
            key={section.id}
            data-section-id={ctx.edit ? section.id : undefined}
            data-selected={ctx.edit?.selectedId === section.id ? "" : undefined}
            data-invalid={ctx.edit?.invalidIds?.has(section.id) ? "" : undefined}
            style={animate ? { animationDelay: `${Math.min(i, 6) * 120}ms` } : undefined}
            className={cn(
              itemClassName,
              stickers && "relative",
              animate && "animate-in duration-700 fill-mode-both fade-in slide-in-from-bottom-4",
            )}
          >
            <SectionView ctx={ctx} section={section} isFirst={i === 0} />
            <StickerLayer stickers={stickers} editable={Boolean(ctx.edit)} />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Alignment for a text block. Auto margins move blocks a design shrinks to
 * their text or centres in a column, where text-align alone does nothing.
 */
function alignStyle(style: TextStyle | undefined): CSSProperties | undefined {
  switch (style?.align) {
    case "left":
      return { textAlign: "left", marginRight: "auto" };
    case "center":
      return { textAlign: "center", marginInline: "auto" };
    case "right":
      return { textAlign: "right", marginLeft: "auto" };
    default:
      return undefined;
  }
}

/** Burmese stacks marks above and below the line, so it needs taller lines than a design sets for Latin. */
const isBurmese = (text: string) => /[\u1000-\u109f]/.test(text);

type StyledProps = {
  style: TextStyle | undefined;
  /** The text itself, to give Burmese the line height it needs. */
  text: string;
  /** Always render the wrapper. The editor sets this so styling a text never rebuilds it mid-edit. */
  wrap?: boolean;
  children: ReactNode;
};

/**
 * Text with the creator's font, size, colour and weight. Size is relative to
 * what the design gives this text. Plain Latin text renders with no wrapper.
 */
function Styled({ style, text, wrap, children }: StyledProps) {
  const { font, scale, color, bold, italic } = style ?? {};
  const burmese = isBurmese(text);
  const styled =
    font !== undefined ||
    scale !== undefined ||
    color !== undefined ||
    bold !== undefined ||
    italic !== undefined;
  if (!styled && !burmese && !wrap) return children;
  return (
    <span
      data-burmese={burmese ? "" : undefined}
      className={font && TEXT_FONTS[font].className}
      style={{
        fontSize: scale === undefined ? undefined : `${scale}em`,
        color,
        fontWeight: bold === undefined ? undefined : bold ? 700 : 400,
        fontStyle: italic === undefined ? undefined : italic ? "italic" : "normal",
      }}
    >
      {children}
    </span>
  );
}

/** A text value, or its editable element when the gift is open in the editor. */
function txt(ctx: Ctx, section: Section, field: string, value: string, index?: number): ReactNode {
  return ctx.edit ? ctx.edit.text({ section, field, index, value }) : value;
}

function SectionView({ ctx, section, isFirst }: { ctx: Ctx; section: Section; isFirst: boolean }) {
  const { media, senderName, compact, placeholders, labels, design } = ctx;
  const editing = Boolean(ctx.edit);
  switch (section.type) {
    case "question":
      return (
        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-[color:var(--t-accent-soft)] p-4 text-left">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[color:var(--t-muted)] uppercase">
            <MessageCircleQuestion className="size-4" />
            {labels.questionNote}
          </p>
          <p className="font-semibold">{section.content.prompt || "…"}</p>
          {section.content.options.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {section.content.options.map((o) => (
                <span
                  key={o.id}
                  className="rounded-full border border-[color:var(--t-accent-soft)] px-3 py-1 text-sm"
                >
                  {o.label}
                </span>
              ))}
            </div>
          )}
          {section.content.kind === "rating" && (
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className="grid size-8 place-items-center rounded-full border border-[color:var(--t-accent-soft)] text-sm"
                >
                  {n}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    case "text": {
      const Heading = isFirst ? "h1" : "h2";
      const st = section.content.styles;
      return (
        <header className="flex flex-col gap-2">
          <Heading
            style={alignStyle(st?.heading)}
            className={cn(
              "font-display leading-[1.12] font-semibold tracking-[-0.01em] text-balance [overflow-wrap:anywhere]",
              compact
                ? isFirst
                  ? "text-3xl"
                  : "text-2xl"
                : isFirst
                  ? "text-[2.5rem]"
                  : "text-3xl",
            )}
          >
            <Styled style={st?.heading} text={section.content.heading} wrap={editing}>
              {txt(ctx, section, "heading", section.content.heading)}
            </Styled>
          </Heading>
          {(section.content.subheading || editing) && (
            <p
              style={alignStyle(st?.subheading)}
              className={cn("text-[color:var(--t-muted)]", compact ? "text-sm" : "text-lg")}
            >
              <Styled style={st?.subheading} text={section.content.subheading} wrap={editing}>
                {txt(ctx, section, "subheading", section.content.subheading)}
              </Styled>
            </p>
          )}
        </header>
      );
    }
    case "message":
      return (
        <p
          style={alignStyle(section.content.styles?.text)}
          className={cn(
            "msg whitespace-pre-line text-[color:var(--t-fg)]/90",
            compact ? "text-base" : "text-lg",
          )}
        >
          <Styled style={section.content.styles?.text} text={section.content.text} wrap={editing}>
            {txt(ctx, section, "text", section.content.text)}
          </Styled>
        </p>
      );
    case "image": {
      const item = section.content.mediaId ? media[section.content.mediaId] : undefined;
      const captionStyle = section.content.styles?.caption;
      if (!item)
        return placeholders ? (
          <PhotoPlaceholder label={labels.addPhoto} polaroid={design === "scrapbook"} />
        ) : null;
      const img = (
        // eslint-disable-next-line @next/next/no-img-element -- private signed URL, optimiser bypassed on purpose
        <img
          src={item.url}
          alt={section.content.caption || ""}
          width={item.width ?? undefined}
          height={item.height ?? undefined}
          loading="lazy"
          decoding="async"
          className={cn(
            "w-full object-cover",
            design === "scrapbook"
              ? "aspect-square"
              : design === "playful"
                ? "rounded-3xl"
                : "rounded-2xl",
          )}
        />
      );
      if (design === "scrapbook") {
        return (
          <figure
            data-photo=""
            style={photoWidth(section.content.size)}
            className="mx-auto w-fit max-w-full -rotate-1 rounded-sm bg-white p-3 pb-10 shadow-lg"
          >
            {img}
            {(section.content.caption || editing) && (
              <figcaption
                style={alignStyle(captionStyle)}
                className="mt-3 text-center font-hand text-xl text-neutral-700"
              >
                <Styled style={captionStyle} text={section.content.caption} wrap={editing}>
                  {txt(ctx, section, "caption", section.content.caption)}
                </Styled>
              </figcaption>
            )}
          </figure>
        );
      }
      return (
        <figure className="flex flex-col gap-2">
          <div data-photo="" style={photoWidth(section.content.size)}>
            {img}
          </div>
          {(section.content.caption || editing) && (
            <figcaption
              style={alignStyle(captionStyle)}
              className="text-center text-sm text-[color:var(--t-muted)]"
            >
              <Styled style={captionStyle} text={section.content.caption} wrap={editing}>
                {txt(ctx, section, "caption", section.content.caption)}
              </Styled>
            </figcaption>
          )}
        </figure>
      );
    }
    case "photo_grid": {
      const items = section.content.mediaIds
        .map((id) => media[id])
        .filter((m): m is MediaItem => Boolean(m));
      const captionStyle = section.content.styles?.caption;
      if (items.length === 0)
        return placeholders ? (
          <PhotoPlaceholder label={labels.addPhoto} polaroid={design === "scrapbook"} />
        ) : null;
      if (design === "scrapbook") {
        return (
          <figure className="flex flex-col gap-3">
            <div
              data-photo=""
              style={photoWidth(section.content.size)}
              className="flex flex-wrap justify-center gap-4"
            >
              {items.map((item, i) => (
                <div
                  key={item.id}
                  className={cn(
                    "w-[44%] rounded-sm bg-white p-2 pb-6 shadow-md",
                    i % 2 ? "rotate-2" : "-rotate-2",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- private signed URL */}
                  <img
                    src={item.thumbUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="aspect-square w-full object-cover"
                  />
                </div>
              ))}
            </div>
            {(section.content.caption || editing) && (
              <figcaption
                style={alignStyle(captionStyle)}
                className="text-center font-hand text-xl"
              >
                <Styled style={captionStyle} text={section.content.caption} wrap={editing}>
                  {txt(ctx, section, "caption", section.content.caption)}
                </Styled>
              </figcaption>
            )}
          </figure>
        );
      }
      return (
        <figure className="flex flex-col gap-2">
          <div
            data-photo=""
            style={photoWidth(section.content.size)}
            className={cn("grid gap-2", items.length === 1 ? "grid-cols-1" : "grid-cols-2")}
          >
            {items.map((item) => (
              // eslint-disable-next-line @next/next/no-img-element -- private signed URL, optimiser bypassed on purpose
              <img
                key={item.id}
                src={item.thumbUrl}
                alt=""
                loading="lazy"
                decoding="async"
                className="aspect-square w-full rounded-xl object-cover"
              />
            ))}
          </div>
          {(section.content.caption || editing) && (
            <figcaption
              style={alignStyle(captionStyle)}
              className="text-center text-sm text-[color:var(--t-muted)]"
            >
              <Styled style={captionStyle} text={section.content.caption} wrap={editing}>
                {txt(ctx, section, "caption", section.content.caption)}
              </Styled>
            </figcaption>
          )}
        </figure>
      );
    }
    case "timeline": {
      const st = section.content.styles;
      return (
        <ol className="relative flex flex-col gap-5 border-l-2 border-[color:var(--t-accent-soft)] pl-5 text-left">
          {section.content.items.map((item, i) => (
            <li key={i} className="relative">
              <span
                aria-hidden="true"
                className="dot absolute top-1.5 -left-[1.6rem] size-3 rounded-full bg-[color:var(--t-accent)] ring-4 ring-[color:var(--t-card)]"
              />
              {(item.date || editing) && (
                <p
                  style={alignStyle(st?.date)}
                  className="text-xs font-semibold tracking-wide text-[color:var(--t-muted)] uppercase"
                >
                  <Styled style={st?.date} text={item.date} wrap={editing}>
                    {txt(ctx, section, "date", item.date, i)}
                  </Styled>
                </p>
              )}
              <p style={alignStyle(st?.title)} className="font-semibold">
                <Styled style={st?.title} text={item.title} wrap={editing}>
                  {txt(ctx, section, "title", item.title, i)}
                </Styled>
              </p>
              {(item.text || editing) && (
                <p
                  style={alignStyle(st?.text)}
                  className="mt-1 text-sm text-[color:var(--t-fg)]/85"
                >
                  <Styled style={st?.text} text={item.text} wrap={editing}>
                    {txt(ctx, section, "text", item.text, i)}
                  </Styled>
                </p>
              )}
            </li>
          ))}
        </ol>
      );
    }
    case "quote": {
      const st = section.content.styles;
      return (
        <blockquote className="flex flex-col gap-2 border-l-4 border-[color:var(--t-accent)] pl-4">
          <p
            style={alignStyle(st?.text)}
            className={cn("font-display text-balance italic", compact ? "text-lg" : "text-2xl")}
          >
            <Styled style={st?.text} text={section.content.text} wrap={editing}>
              “{txt(ctx, section, "text", section.content.text)}”
            </Styled>
          </p>
          {(section.content.attribution || editing) && (
            <footer
              style={alignStyle(st?.attribution)}
              className="text-sm text-[color:var(--t-muted)]"
            >
              <Styled style={st?.attribution} text={section.content.attribution} wrap={editing}>
                — {txt(ctx, section, "attribution", section.content.attribution)}
              </Styled>
            </footer>
          )}
        </blockquote>
      );
    }
    case "final_message": {
      const signature = section.content.signature.trim() || senderName;
      const st = section.content.styles;
      if (!section.content.text && !signature && !editing) return null;
      return (
        <footer className="flex flex-col gap-1 border-t border-[color:var(--t-accent-soft)] pt-5">
          {(section.content.text || editing) && (
            <p style={alignStyle(st?.text)} className="text-[color:var(--t-fg)]/85">
              <Styled style={st?.text} text={section.content.text} wrap={editing}>
                {txt(ctx, section, "text", section.content.text)}
              </Styled>
            </p>
          )}
          {(signature || editing) && (
            <p style={alignStyle(st?.signature)} className="sig font-display text-xl font-semibold">
              {/* The editor edits the stored signature; left empty, the sender's name shows as its placeholder. */}
              <Styled style={st?.signature} text={signature} wrap={editing}>
                {editing ? txt(ctx, section, "signature", section.content.signature) : signature}
              </Styled>
            </p>
          )}
        </footer>
      );
    }
  }
}

/**
 * The width a creator chose for a photo, as a style. A percentage of the
 * section, so it is the same share of the card on every screen. Nothing
 * when no size was chosen: the photo then fills the width as it always did.
 */
function photoWidth(size: number | undefined): React.CSSProperties | undefined {
  return size === undefined || size >= 100
    ? undefined
    : { width: `${size}%`, marginInline: "auto" };
}

function PhotoPlaceholder({ label, polaroid }: { label: string; polaroid?: boolean }) {
  return (
    <div
      className={cn(
        "flex aspect-[4/3] flex-col items-center justify-center gap-2 border-2 border-dashed border-[color:var(--t-accent-soft)] text-[color:var(--t-muted)]",
        polaroid ? "mx-auto w-2/3 -rotate-1 rounded-sm bg-white/60" : "rounded-2xl",
      )}
    >
      <ImagePlus className="size-6" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
