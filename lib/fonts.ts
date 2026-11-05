import {
  Bebas_Neue,
  Caveat,
  Fraunces,
  Noto_Sans_Myanmar,
  Noto_Serif_Myanmar,
  Pacifico,
  Padauk,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Special_Elite,
} from "next/font/google";

/** Handwriting for playful and letter-style templates. Latin only; Burmese falls back. */
export const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-caveat",
  display: "swap",
});

/** Interface text. */
export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

/** Wordmark and gift headings. */
export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "opsz"],
});

/** Burmese interface text. Only the myanmar subset is loaded. */
export const notoSansMyanmar = Noto_Sans_Myanmar({
  subsets: ["myanmar"],
  variable: "--font-myanmar",
  display: "swap",
});

/** Burmese gift headings. */
export const notoSerifMyanmar = Noto_Serif_Myanmar({
  subsets: ["myanmar"],
  weight: ["400", "600", "700"],
  variable: "--font-myanmar-serif",
  display: "swap",
});

/*
 * Extra faces a creator can pick for a text on a gift, see
 * components/gift/text-fonts.ts. Not preloaded: a browser fetches one only
 * when a gift on the page actually uses it.
 */

/** Rounded brush script. Latin only; Burmese falls back. */
export const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pacifico",
  display: "swap",
  preload: false,
});

/** High-contrast serif for elegant headings. Latin only; Burmese falls back. */
export const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
  preload: false,
});

/** Tall poster capitals. Latin only; Burmese falls back. */
export const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
  preload: false,
});

/** Worn typewriter. Latin only; Burmese falls back. */
export const specialElite = Special_Elite({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-special-elite",
  display: "swap",
  preload: false,
});

/** A third Burmese face beside the two Noto ones, with its own Latin. */
export const padauk = Padauk({
  subsets: ["latin", "myanmar"],
  weight: ["400", "700"],
  variable: "--font-padauk-face",
  display: "swap",
  preload: false,
});

export const fontVariables = [
  jakarta.variable,
  fraunces.variable,
  caveat.variable,
  notoSansMyanmar.variable,
  notoSerifMyanmar.variable,
  pacifico.variable,
  playfair.variable,
  bebasNeue.variable,
  specialElite.variable,
  padauk.variable,
].join(" ");
