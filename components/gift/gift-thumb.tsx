import type { GiftCard } from "@/features/gifts/queries";
import { cn } from "@/lib/utils";
import { GiftView } from "./gift-view";

type Props = { card: GiftCard; senderName: string; className?: string };

/**
 * A picture of a gift for galleries: the real gift, scaled to the box and
 * cropped to its top. Purely visual, so it is hidden from screen readers and
 * cannot be clicked into; the card around it carries the name and the link.
 */
export function GiftThumb({ card, senderName, className }: Props) {
  return (
    // A short gift sits in the middle of the box like a card on a mat; a tall
    // one starts at the top and is cropped ("safe" centring never cuts the top).
    <div
      aria-hidden="true"
      className={cn(
        "relative flex aspect-[4/5] flex-col [justify-content:safe_center] overflow-hidden rounded-2xl bg-secondary",
        className,
      )}
    >
      <div className="pointer-events-none w-full shrink-0 select-none">
        <GiftView
          sections={card.sections}
          media={card.media}
          variant={card.variant}
          colors={card.colors}
          stickers={card.stickers}
          scene={card.scene}
          style={card.style}
          recipientName={card.recipient?.name ?? ""}
          senderName={senderName}
        />
      </div>
    </div>
  );
}
