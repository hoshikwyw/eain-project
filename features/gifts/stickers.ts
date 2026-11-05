/**
 * Built-in stickers. Keys are stored on gifts, so never rename or remove one;
 * add new keys instead. A sticker whose key is unknown is simply not drawn.
 */
export const STICKERS = {
  heart: "❤️",
  "pink-heart": "💖",
  sparkles: "✨",
  star: "⭐",
  balloon: "🎈",
  party: "🎉",
  cake: "🎂",
  gift: "🎁",
  flower: "🌸",
  rose: "🌹",
  bouquet: "💐",
  butterfly: "🦋",
  rainbow: "🌈",
  sun: "☀️",
  moon: "🌙",
  crown: "👑",
} as const;

export type StickerKind = keyof typeof STICKERS;

export const STICKER_KINDS = Object.keys(STICKERS) as [StickerKind, ...StickerKind[]];
