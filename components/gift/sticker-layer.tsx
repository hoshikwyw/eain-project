import type { Sticker } from "@/features/gifts/schemas";
import { STICKERS } from "@/features/gifts/stickers";
import { cn } from "@/lib/utils";

/** One sticker's artwork, filling the box it is given. */
export function StickerArt({ kind }: { kind: Sticker["kind"] }) {
  return (
    <svg viewBox="0 0 100 100" className="block size-full overflow-visible">
      <text x="50" y="52" fontSize="80" textAnchor="middle" dominantBaseline="central">
        {STICKERS[kind]}
      </text>
    </svg>
  );
}

type Props = {
  stickers: Sticker[] | undefined;
  clip?: boolean;
  /** Marks each sticker so the editor can pick it up. Stickers never take taps otherwise. */
  editable?: boolean;
};

/**
 * Stickers over the box they sit on: the whole gift or one section. The
 * parent must be positioned. Purely visual, so hidden from screen readers
 * and never in the way of a tap. Raised above the sections, so a sticker
 * that reaches over the next section is not tucked under it.
 */
export function StickerLayer({ stickers, clip, editable }: Props) {
  if (!stickers || stickers.length === 0) return null;
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-10 select-none",
        clip && "overflow-hidden",
      )}
    >
      {stickers.map((s) => (
        <div
          key={s.id}
          data-sticker-id={editable ? s.id : undefined}
          className="absolute aspect-square"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}%`,
            transform: `translate(-50%, -50%) rotate(${s.rotate}deg)`,
          }}
        >
          <StickerArt kind={s.kind} />
        </div>
      ))}
    </div>
  );
}
