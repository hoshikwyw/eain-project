import { ImagePlus } from "lucide-react";
import { Lovebirds } from "@/components/brand/lovebirds";
import type { MediaItem, Section, ThemeVariant } from "@/features/gifts/schemas";
import type { Decoration, TemplateStyle } from "@/features/gifts/templates";
import { cn } from "@/lib/utils";
import { palettes } from "./palettes";

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
  /** Labels the renderer needs; passed in so this stays a server-safe component. */
  labels: { forName: string; forYou: string; addPhoto: string };
};

/**
 * Renders any gift from its sections. All ten templates share this; they
 * differ by palette, decoration, layout and starting sections.
 */
export function GiftRenderer({
  sections,
  media,
  variant,
  style,
  recipientName,
  senderName,
  compact,
  placeholders,
  animate,
  labels,
}: Props) {
  const name = recipientName.trim();
  const eyebrow = name ? labels.forName.replace("{name}", name) : labels.forYou;

  const body = sections.map((section, index) => (
    <SectionView
      key={section.id}
      section={section}
      media={media}
      senderName={senderName}
      compact={compact}
      placeholders={placeholders}
      addPhotoLabel={labels.addPhoto}
      isFirst={index === 0}
    />
  ));

  if (style.layout === "scroll") {
    return (
      <div style={palettes[variant]} className="relative overflow-hidden rounded-3xl p-3 text-[color:var(--t-fg)] [background:var(--t-bg)] sm:p-5">
        <Decorations kind={style.decoration} />
        <p className="relative px-2 pt-2 pb-4 text-xs font-semibold tracking-[0.2em] uppercase text-[color:var(--t-muted)]">{eyebrow}</p>
        <div className={cn("relative flex flex-col", compact ? "gap-3" : "gap-4")}>
          {body.map((node, i) => (
            <div
              key={sections[i]!.id}
              style={animate ? { animationDelay: `${Math.min(i, 6) * 120}ms` } : undefined}
              className={cn(
                "rounded-2xl bg-[color:var(--t-card)]/90 backdrop-blur-sm",
                compact ? "p-5" : "p-6 sm:p-8",
                animate && "animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700",
              )}
            >
              {node}
            </div>
          ))}
        </div>
        <div className={cn("relative mx-auto pt-4", compact ? "max-w-44" : "max-w-64")}>
          <Lovebirds />
        </div>
      </div>
    );
  }

  return (
    <article style={palettes[variant]} className="relative overflow-hidden rounded-3xl p-1 text-[color:var(--t-fg)] [background:var(--t-bg)]">
      <Decorations kind={style.decoration} />
      <div
        className={cn(
          "relative flex flex-col rounded-[1.375rem] bg-[color:var(--t-card)]/85 backdrop-blur-sm",
          compact ? "gap-5 p-6" : "gap-7 p-7 sm:p-10",
        )}
      >
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[color:var(--t-muted)]">{eyebrow}</p>
        {body}
        <div className={cn("mx-auto w-full", compact ? "max-w-52" : "max-w-72")}>
          <Lovebirds />
        </div>
      </div>
    </article>
  );
}

type SectionProps = {
  section: Section;
  media: Record<string, MediaItem>;
  senderName: string;
  compact?: boolean;
  placeholders?: boolean;
  addPhotoLabel: string;
  isFirst: boolean;
};

function SectionView({ section, media, senderName, compact, placeholders, addPhotoLabel, isFirst }: SectionProps) {
  switch (section.type) {
    case "text": {
      const Heading = isFirst ? "h1" : "h2";
      return (
        <header className="flex flex-col gap-2">
          <Heading
            className={cn(
              "font-display font-semibold text-balance leading-tight",
              compact ? (isFirst ? "text-3xl" : "text-2xl") : isFirst ? "text-4xl sm:text-5xl" : "text-3xl",
            )}
          >
            {section.content.heading}
            {isFirst && (
              <span aria-hidden="true" className="ml-2 text-[color:var(--t-accent)]">
                ♥
              </span>
            )}
          </Heading>
          {section.content.subheading && (
            <p className={cn("text-[color:var(--t-muted)]", compact ? "text-sm" : "text-lg")}>{section.content.subheading}</p>
          )}
        </header>
      );
    }
    case "message":
      return (
        <p className={cn("whitespace-pre-line text-[color:var(--t-fg)]/90", compact ? "text-base" : "text-lg")}>
          {section.content.text}
        </p>
      );
    case "image": {
      const item = section.content.mediaId ? media[section.content.mediaId] : undefined;
      if (!item) return placeholders ? <PhotoPlaceholder label={addPhotoLabel} /> : null;
      return (
        <figure className="flex flex-col gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- private signed URL, optimiser bypassed on purpose */}
          <img
            src={item.url}
            alt={section.content.caption || ""}
            width={item.width ?? undefined}
            height={item.height ?? undefined}
            loading="lazy"
            decoding="async"
            className="w-full rounded-2xl object-cover"
          />
          {section.content.caption && (
            <figcaption className="text-center text-sm text-[color:var(--t-muted)]">{section.content.caption}</figcaption>
          )}
        </figure>
      );
    }
    case "photo_grid": {
      const items = section.content.mediaIds.map((id) => media[id]).filter((m): m is MediaItem => Boolean(m));
      if (items.length === 0) return placeholders ? <PhotoPlaceholder label={addPhotoLabel} /> : null;
      return (
        <figure className="flex flex-col gap-2">
          <div className={cn("grid gap-2", items.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
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
          {section.content.caption && (
            <figcaption className="text-center text-sm text-[color:var(--t-muted)]">{section.content.caption}</figcaption>
          )}
        </figure>
      );
    }
    case "timeline":
      return (
        <ol className="relative flex flex-col gap-5 border-l-2 border-[color:var(--t-accent-soft)] pl-5">
          {section.content.items.map((item, i) => (
            <li key={i} className="relative">
              <span
                aria-hidden="true"
                className="absolute top-1.5 -left-[1.6rem] size-3 rounded-full bg-[color:var(--t-accent)] ring-4 ring-[color:var(--t-card)]"
              />
              {item.date && (
                <p className="text-xs font-semibold tracking-wide uppercase text-[color:var(--t-muted)]">{item.date}</p>
              )}
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
          {section.content.attribution && (
            <footer className="text-sm text-[color:var(--t-muted)]">— {section.content.attribution}</footer>
          )}
        </blockquote>
      );
    case "final_message": {
      const signature = section.content.signature.trim() || senderName;
      if (!section.content.text && !signature) return null;
      return (
        <footer className="flex flex-col gap-1 border-t border-[color:var(--t-accent-soft)] pt-5">
          {section.content.text && <p className="text-[color:var(--t-fg)]/85">{section.content.text}</p>}
          {signature && <p className="font-display text-xl font-semibold">{signature}</p>}
        </footer>
      );
    }
  }
}

function PhotoPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[color:var(--t-accent-soft)] text-[color:var(--t-muted)]">
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
            return (
              <span
                key={i}
                style={style}
                className={cn("absolute h-3 w-1.5 rounded-sm opacity-60", i % 2 ? "bg-[color:var(--t-accent)]" : "bg-[color:var(--glow)]")}
              />
            );
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
