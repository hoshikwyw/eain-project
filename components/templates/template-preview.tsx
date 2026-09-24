"use client";

import { useMemo } from "react";
import { GiftView } from "@/components/gift/gift-view";
import { palettes } from "@/components/gift/palettes";
import type { ThemeVariant } from "@/features/gifts/schemas";
import { getTemplateStyle, templates } from "@/features/gifts/templates";

type Props = { slug: string; variant: ThemeVariant; locale: "en" | "my"; name: string };

/**
 * Miniature of a template: the real renderer with the template's starting
 * sections, drawn at full size and scaled down, cropped to a 4:3 window.
 * Templates without a layout in code fall back to a palette swatch.
 */
export function TemplatePreview({ slug, variant, locale, name }: Props) {
  const definition = templates[slug];
  const sections = useMemo(() => definition?.defaultSections(locale) ?? [], [definition, locale]);

  if (!definition) {
    return (
      <div style={palettes[variant]} className="flex aspect-[4/3] items-end rounded-xl p-4 text-[color:var(--t-fg)] [background:var(--t-bg)]">
        <span className="font-display text-xl font-semibold">{name}</span>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
      <div className="pointer-events-none absolute inset-0 origin-top-left select-none" style={{ width: "250%", transform: "scale(0.4)" }}>
        <GiftView
          sections={sections}
          media={{}}
          variant={variant}
          style={getTemplateStyle(slug)}
          recipientName=""
          senderName=""
          compact
          placeholders
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />
    </div>
  );
}
