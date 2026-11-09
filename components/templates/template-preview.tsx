"use client";

import { useMemo } from "react";
import { GiftView } from "@/components/gift/gift-view";
import { palettes } from "@/components/gift/palettes";
import type { ThemeVariant } from "@/features/gifts/schemas";
import { sampleGift } from "@/features/gifts/sample-gift";
import { getTemplateStyle } from "@/features/gifts/templates";

type Props = { slug: string; variant: ThemeVariant; locale: "en" | "my"; name: string };

/**
 * Miniature of a template: the real renderer with the template's starting
 * sections and sample photos, scaled to the card's width like any gift and cropped to a 4:3
 * window, fading out where it is cut off. Templates without a layout in code fall back to a palette swatch.
 */
export function TemplatePreview({ slug, variant, locale, name }: Props) {
  const sample = useMemo(() => sampleGift(slug, locale), [slug, locale]);

  if (!sample) {
    return (
      <div
        style={palettes[variant]}
        className="flex aspect-[4/3] items-end rounded-xl p-4 text-[color:var(--t-fg)] [background:var(--t-bg)]"
      >
        <span className="font-display text-xl font-semibold">{name}</span>
      </div>
    );
  }

  return (
    // The thin frame keeps a pale template visible on a pale page; the picture inside fades out at its cut-off edge.
    <div aria-hidden="true" className="rounded-xl ring-1 ring-border/70">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted [mask-image:linear-gradient(to_bottom,black_calc(100%-3rem),transparent)]">
        <div className="pointer-events-none select-none">
          <GiftView
            sections={sample.sections}
            media={sample.media}
            variant={variant}
            style={getTemplateStyle(slug)}
            recipientName=""
            senderName=""
            compact
          />
        </div>
      </div>
    </div>
  );
}
