import type { CSSProperties } from "react";
import type { ThemeVariant } from "@/features/gifts/schemas";

/**
 * Template palettes. A gift looks the same for the receiver regardless of
 * the site theme, so these are set as CSS variables on the gift wrapper.
 * The bird illustration reads --bird-* and --branch from the same scope.
 */
export const palettes: Record<ThemeVariant, CSSProperties> = {
  blossom: {
    "--t-bg": "linear-gradient(160deg, #fff5f0 0%, #ffe3e6 60%, #ffd6dc 100%)",
    "--t-card": "#fffaf8",
    "--t-fg": "#3a2326",
    "--t-muted": "#8a6b70",
    "--t-accent": "#e8476c",
    "--t-accent-soft": "#ffe1e7",
    "--t-deco": "#f4a3b5",
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
    "--t-deco": "#fcd9a8",
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
  mint: {
    "--t-bg": "linear-gradient(160deg, #f2fbf6 0%, #dff5ea 60%, #cdeedd 100%)",
    "--t-card": "#f9fdfb",
    "--t-fg": "#1f3b2f",
    "--t-muted": "#5f7f70",
    "--t-accent": "#1f8a5b",
    "--t-accent-soft": "#d6f2e3",
    "--t-deco": "#8fd6b4",
    "--brand": "#1f8a5b",
    "--brand-soft": "#d6f2e3",
    "--glow": "#ffe7a8",
    "--foreground": "#1f3b2f",
    "--bird-a": "#f5a3b8",
    "--bird-a-wing": "#ec8aa4",
    "--bird-b": "#6cc3a0",
    "--bird-b-wing": "#54ad89",
    "--branch": "#7a5a45",
  } as CSSProperties,
  sunset: {
    "--t-bg": "linear-gradient(160deg, #fff4e8 0%, #ffe0c7 55%, #ffc9b3 100%)",
    "--t-card": "#fffaf5",
    "--t-fg": "#3d2418",
    "--t-muted": "#8c6a58",
    "--t-accent": "#e0642d",
    "--t-accent-soft": "#ffe4d4",
    "--t-deco": "#ffb38a",
    "--brand": "#e0642d",
    "--brand-soft": "#ffe4d4",
    "--glow": "#ffd27a",
    "--foreground": "#3d2418",
    "--bird-a": "#f59b7e",
    "--bird-a-wing": "#e8825f",
    "--bird-b": "#8fb8d9",
    "--bird-b-wing": "#76a2c6",
    "--branch": "#8a5a3c",
  } as CSSProperties,
};

/** Swatch colour for pickers, one per variant. */
export const variantSwatch: Record<ThemeVariant, string> = {
  blossom: "#f4a3b5",
  night: "#3a2372",
  mint: "#6cc3a0",
  sunset: "#f59b7e",
};
