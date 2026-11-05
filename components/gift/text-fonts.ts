import type { TextFont } from "@/features/gifts/schemas";

/**
 * Fonts a creator can give a text. `className` is the Tailwind font utility
 * (see the --font-* theme variables in app/globals.css); `label` is the
 * typeface's own name, shown in the editor's font list.
 */
export const TEXT_FONTS: Record<TextFont, { label: string; className: string }> = {
  serif: { label: "Fraunces", className: "font-display" },
  sans: { label: "Jakarta Sans", className: "font-sans" },
  hand: { label: "Caveat", className: "font-hand" },
  script: { label: "Pacifico", className: "font-script" },
  elegant: { label: "Playfair", className: "font-elegant" },
  poster: { label: "Bebas Neue", className: "font-poster" },
  typewriter: { label: "Special Elite", className: "font-typewriter" },
  padauk: { label: "Padauk", className: "font-padauk" },
};
