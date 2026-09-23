import type { CSSProperties } from "react";
import { Lovebirds } from "@/components/brand/lovebirds";
import type { PostcardContent } from "@/features/gifts/schemas";
import { cn } from "@/lib/utils";

/**
 * Birthday Postcard layout. Templates carry their own palette so a gift
 * looks the same for the receiver regardless of the site theme. Palettes
 * are set as CSS variables on the wrapper, and the bird illustration reads
 * the same variable names.
 */
const palettes: Record<PostcardContent["variant"], CSSProperties> = {
  blossom: {
    "--t-bg": "linear-gradient(160deg, #fff5f0 0%, #ffe3e6 60%, #ffd6dc 100%)",
    "--t-card": "#fffaf8",
    "--t-fg": "#3a2326",
    "--t-muted": "#8a6b70",
    "--t-accent": "#e8476c",
    "--t-accent-soft": "#ffe1e7",
    "--brand": "#e8476c",
    "--brand-soft": "#ffe1e7",
    "--glow": "#ffd9a0",
    "--foreground": "#3a2326",
    "--bird-a": "#f58aa0",
    "--bird-a-wing": "#ee6f8a",
    "--bird-b": "#7fb2d0",
    "--bird-b-wing": "#6a9dbd",
    "--branch": "#8b5e4b",
  } as CSSProperties,
  night: {
    "--t-bg": "linear-gradient(160deg, #1b1442 0%, #2a1c5e 60%, #3a2372 100%)",
    "--t-card": "#241b52",
    "--t-fg": "#f6f1ff",
    "--t-muted": "#b7adda",
    "--t-accent": "#f06ab0",
    "--t-accent-soft": "#3d2260",
    "--brand": "#f06ab0",
    "--brand-soft": "#3d2260",
    "--glow": "#fcd9a8",
    "--foreground": "#f6f1ff",
    "--bird-a": "#f27fb2",
    "--bird-a-wing": "#e0609b",
    "--bird-b": "#8f7bea",
    "--bird-b-wing": "#7560d6",
    "--branch": "#6d4f63",
  } as CSSProperties,
};

type Props = {
  content: PostcardContent;
  senderName: string;
  className?: string;
  /** Compact mode for the editor preview. */
  compact?: boolean;
};

export function BirthdayPostcard({ content, senderName, className, compact }: Props) {
  const name = content.recipientName.trim();
  const signature = content.signature.trim() || senderName;

  return (
    <article
      lang={undefined}
      style={palettes[content.variant]}
      className={cn(
        "relative overflow-hidden rounded-3xl p-1 text-[color:var(--t-fg)] [background:var(--t-bg)]",
        className,
      )}
    >
      <Petals variant={content.variant} />
      <div
        className={cn(
          "relative flex flex-col gap-6 rounded-[1.375rem] bg-[color:var(--t-card)]/85 backdrop-blur-sm",
          compact ? "p-6" : "p-7 sm:p-10",
        )}
      >
        <header className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[color:var(--t-muted)]">
            {name ? `For ${name}` : "For you"}
          </p>
          <h1
            className={cn(
              "font-display font-semibold text-balance leading-tight",
              compact ? "text-3xl" : "text-4xl sm:text-5xl",
            )}
          >
            {content.heading}
            <span aria-hidden="true" className="ml-2 text-[color:var(--t-accent)]">
              ♥
            </span>
          </h1>
        </header>

        <p className={cn("whitespace-pre-line text-[color:var(--t-fg)]/90", compact ? "text-base" : "text-lg")}>
          {content.message}
        </p>

        <div className={cn("mx-auto w-full", compact ? "max-w-52" : "max-w-72")}>
          <Lovebirds />
        </div>

        {(content.finalMessage || signature) && (
          <footer className="flex flex-col gap-1 border-t border-[color:var(--t-accent-soft)] pt-5">
            {content.finalMessage && <p className="text-[color:var(--t-fg)]/85">{content.finalMessage}</p>}
            {signature && <p className="font-display text-xl font-semibold">{signature}</p>}
          </footer>
        )}
      </div>
    </article>
  );
}

/** Soft decorative dots: petals by day, stars by night. Purely visual. */
function Petals({ variant }: { variant: PostcardContent["variant"] }) {
  const dots = [
    [6, 8, 14],
    [88, 12, 10],
    [12, 78, 12],
    [92, 70, 9],
    [50, 4, 7],
    [72, 92, 12],
    [30, 94, 8],
  ] as const;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {dots.map(([x, y, s], i) => (
        <span
          key={i}
          className={cn("absolute rounded-full", variant === "night" ? "bg-[color:var(--glow)]" : "bg-[color:var(--t-accent)]")}
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: variant === "night" ? s / 3 : s,
            height: variant === "night" ? s / 3 : s,
            opacity: variant === "night" ? 0.9 : 0.35,
          }}
        />
      ))}
    </div>
  );
}
