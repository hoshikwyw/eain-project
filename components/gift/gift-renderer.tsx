import type { Sticker } from "@/features/gifts/schemas";
import { renderDesign } from "./gift-designs";
import { GiftStage } from "./gift-stage";
import type { Ctx, GiftRendererProps } from "./gift-types";
import { giftPalette } from "./palettes";
import { StickerLayer } from "./sticker-layer";

export type { GiftEdit } from "./gift-types";

/**
 * Renders any gift from its sections. Each template has a design that sets
 * the frame, heading treatment, background pattern and how sections dress,
 * so a postcard looks like a postcard and a memory page like a scrapbook.
 *
 * A gift is one card of a fixed width, scaled to the screen by GiftStage.
 * Nothing in here may depend on the screen size (no sm: or md: classes), or
 * the card would lay out differently from one screen to the next and stickers
 * would drift away from the text they were placed beside.
 */
export function GiftRenderer(props: GiftRendererProps) {
  const { sections, style, variant, colors, stickers = [], recipientName, questionMode = "preview", labels } = props;
  const name = recipientName.trim();
  const eyebrow = name ? labels.forName.replace("{name}", name) : labels.forYou;
  const visible = questionMode === "hidden" ? sections.filter((s) => s.type !== "question") : sections;

  // Stickers follow the section they sit on. A sticker on a section that is
  // not shown (a question on the receiver page) is not shown either.
  const sectionStickers = new Map<string, Sticker[]>();
  for (const s of stickers) {
    const id = s.anchor === undefined ? undefined : sections[s.anchor]?.id;
    if (id !== undefined) sectionStickers.set(id, [...(sectionStickers.get(id) ?? []), s]);
  }
  const ctx: Ctx = { ...props, design: style.design, eyebrow, visible, sectionStickers };

  return (
    <GiftStage>
      <div style={giftPalette(variant, colors)} className="relative text-[color:var(--t-fg)]">
        {renderDesign(ctx)}
        <StickerLayer stickers={stickers.filter((s) => s.anchor === undefined)} clip editable={Boolean(props.edit)} />
      </div>
    </GiftStage>
  );
}
