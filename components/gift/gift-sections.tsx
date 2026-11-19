import { CalendarDays, CalendarPlus, Clock, ImagePlus, Info, MapPin, Reply } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { calendarEntry, googleCalendarUrl } from "@/features/gifts/calendar";
import { formatDay, rsvpClosed } from "@/features/gifts/rsvp";
import type { MediaItem, Section, TextStyle } from "@/features/gifts/schemas";
import { cn } from "@/lib/utils";
import type { Ctx } from "./gift-types";
import { isInvitationDesign } from "@/features/gifts/templates";
import { QuestionPreview, QuestionSlot } from "./answer";
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

/** Two corner mounts, top-left and bottom-right, holding a scrapbook photo to its page. */
const PHOTO_CORNERS =
  "relative before:absolute before:top-0 before:left-0 before:size-3.5 before:bg-[color:var(--t-fg)]/75 before:[clip-path:polygon(0_0,100%_0,0_100%)] before:content-[''] after:absolute after:right-0 after:bottom-0 after:size-3.5 after:bg-[color:var(--t-fg)]/75 after:[clip-path:polygon(100%_100%,100%_0,0_100%)] after:content-['']";

function SectionView({ ctx, section, isFirst }: { ctx: Ctx; section: Section; isFirst: boolean }) {
  const { media, senderName, compact, placeholders, labels, design } = ctx;
  const editing = Boolean(ctx.edit);
  switch (section.type) {
    case "question": {
      const questions = ctx.visible.filter((s) => s.type === "question");
      const last = questions.at(-1)?.id === section.id;
      if (ctx.questionMode === "answer") {
        return (
          <QuestionSlot
            questionId={section.content.questionId}
            last={last}
            prompt={section.content.prompt}
            required={section.content.required}
          />
        );
      }
      const c = section.content;
      return (
        <QuestionPreview
          question={{
            id: c.questionId,
            kind: c.kind,
            prompt: c.prompt,
            required: c.required,
            options: c.options,
          }}
          last={last}
          invitation={isInvitationDesign(design)}
          note={labels.questionNote}
        />
      );
    }
    case "text": {
      // The look hangs on the class (the designs style .h1 and .h2); the tag is the real
      // heading on a page, and a plain paragraph inside a thumbnail, which is a picture.
      const second = ctx.headingLevel === 2;
      const Heading = ctx.inert ? "p" : isFirst ? (second ? "h2" : "h1") : second ? "h3" : "h2";
      const st = section.content.styles;
      return (
        <header className="flex flex-col gap-2">
          <Heading
            style={alignStyle(st?.heading)}
            className={cn(
              isFirst ? "h1" : "h2",
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
      const polaroid =
        design === "scrapbook" || design === "letter" || design === "party" || design === "journey";
      if (!item)
        return placeholders ? (
          <PhotoPlaceholder label={labels.addPhoto} polaroid={polaroid} />
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
            polaroid ? "aspect-square" : design === "playful" ? "rounded-3xl" : "rounded-2xl",
          )}
        />
      );
      if (polaroid) {
        return (
          <figure
            data-photo=""
            style={photoWidth(section.content.size)}
            className={cn(
              "mx-auto w-fit max-w-full -rotate-1 rounded-sm bg-white p-3 pb-10 shadow-lg",
              // A letter's or a party card's photo is taped in.
              (design === "letter" || design === "party") &&
                "relative before:absolute before:-top-2.5 before:left-1/2 before:h-5 before:w-20 before:-translate-x-1/2 before:rotate-[-4deg] before:rounded-sm before:bg-[color:var(--glow)]/60 before:content-['']",
              (design === "scrapbook" || design === "journey") && PHOTO_CORNERS,
            )}
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
          <PhotoPlaceholder
            label={labels.addPhoto}
            polaroid={design === "scrapbook" || design === "journey"}
          />
        ) : null;
      if (design === "scrapbook" || design === "journey") {
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
                    PHOTO_CORNERS,
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
              {item.mediaId && media[item.mediaId] && (
                <span
                  className={cn(
                    "stop-photo mb-2 block w-full",
                    design === "journey" || design === "scrapbook"
                      ? cn(
                          "rounded-sm bg-white p-1.5 pb-4 shadow-md",
                          i % 2 ? "rotate-2" : "-rotate-2",
                        )
                      : "overflow-hidden rounded-xl",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- private signed URL, optimiser bypassed on purpose */}
                  <img
                    src={media[item.mediaId]!.thumbUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </span>
              )}
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
    case "event": {
      const st = section.content.styles;
      const calendar = calendarEntry(section, ctx.sections, labels.calendarTitle);
      // The deadline is announced while it is ahead; once past, the question slot says so.
      const replyBy =
        section.content.rsvpBy && !rsvpClosed(section.content.rsvpBy)
          ? labels.replyBy.replace("{date}", formatDay(section.content.rsvpBy, labels.locale))
          : null;
      const rows = [
        ["date", CalendarDays, section.content.date, "text-lg font-semibold"],
        ["time", Clock, section.content.time, ""],
        ["place", MapPin, section.content.place, ""],
        ["note", Info, section.content.note, "text-sm text-[color:var(--t-muted)]"],
      ] as const;
      return (
        <ul className="event flex flex-col gap-2.5 rounded-2xl border border-[color:var(--t-accent-soft)] px-5 py-4 text-left">
          {rows.map(([field, Icon, value, look]) =>
            value || editing ? (
              <li key={field} className="flex items-start gap-3">
                <Icon
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0 text-[color:var(--t-accent)]"
                />
                <p style={alignStyle(st?.[field])} className={cn("min-w-0 flex-1", look)}>
                  {field === "place" && !editing && !ctx.inert ? (
                    // The place opens in the phone's maps app; the words stay the creator's.
                    // Thumbnails (inert) carry no links: they often sit inside a link themselves.
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={labels.openInMaps}
                      className="underline decoration-dotted underline-offset-4 hover:decoration-solid"
                    >
                      <Styled style={st?.[field]} text={value}>
                        {value}
                      </Styled>
                    </a>
                  ) : (
                    <Styled style={st?.[field]} text={value} wrap={editing}>
                      {txt(ctx, section, field, value)}
                    </Styled>
                  )}
                </p>
              </li>
            ) : null,
          )}
          {replyBy && (
            <li className="reply-by flex items-start gap-3 text-sm">
              <Reply
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-[color:var(--t-accent)]"
              />
              <p className="min-w-0 flex-1 font-semibold">{replyBy}</p>
            </li>
          )}
          {calendar && (
            // Only when the creator set a real date. In the editor the links are pictured, not live.
            <li className="calendar flex flex-wrap items-center gap-x-3 gap-y-2 pt-1">
              <CalendarPlus
                aria-hidden="true"
                className="size-4 shrink-0 text-[color:var(--t-accent)]"
              />
              <span className="text-sm text-[color:var(--t-muted)]">{labels.addToCalendar}</span>
              <span className="flex flex-wrap gap-2">
                <CalendarChip href={editing || ctx.inert ? undefined : googleCalendarUrl(calendar)}>
                  {labels.calendarGoogle}
                </CalendarChip>
                <CalendarChip
                  href={
                    editing || ctx.inert || !ctx.calendarBase
                      ? undefined
                      : `${ctx.calendarBase}?section=${section.id}`
                  }
                >
                  {labels.calendarIcs}
                </CalendarChip>
              </span>
            </li>
          )}
        </ul>
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

/** One small pill in the "Add to calendar" row. A plain span where there is nothing to open yet. */
function CalendarChip({ href, children }: { href?: string; children: ReactNode }) {
  const look =
    "rounded-full border border-[color:var(--t-accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--t-accent)]";
  if (!href) return <span className={look}>{children}</span>;
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className={cn(
        look,
        "transition-colors hover:bg-[color:var(--t-accent-soft)] focus-visible:ring-2 focus-visible:ring-[color:var(--t-accent)]/50 focus-visible:outline-none",
      )}
    >
      {children}
    </a>
  );
}
