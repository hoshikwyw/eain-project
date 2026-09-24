import {
  Caveat,
  Fraunces,
  Noto_Sans_Myanmar,
  Noto_Serif_Myanmar,
  Plus_Jakarta_Sans,
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

export const fontVariables = [
  jakarta.variable,
  fraunces.variable,
  caveat.variable,
  notoSansMyanmar.variable,
  notoSerifMyanmar.variable,
].join(" ");
