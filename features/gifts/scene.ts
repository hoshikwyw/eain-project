import { z } from "zod";
import type { Section } from "./schemas";

/**
 * Scene templates. Most templates are cards; a scene is an animation that
 * plays in its own frame (public/scenes/<kind>/index.html) and is told what
 * to show: here, a name, the pages of a message and a flower colour.
 */
export type SceneKind = "night-garden";

export const SCENE_SRC: Record<SceneKind, string> = {
  "night-garden": "/scenes/night-garden/index.html",
};

/** Stored on gifts, so never rename or remove a key. Full palettes: public/scenes/night-garden/js/config.js. */
export const flowerColorSchema = z.enum(["white", "pink", "yellow", "lavender", "red", "blue"]);
export type FlowerColor = z.infer<typeof flowerColorSchema>;
export const FLOWER_COLORS = flowerColorSchema.options;

/** A petal and its edge, for the editor's colour picker and the summary card. */
export const flowerSwatch: Record<FlowerColor, { petal: string; edge: string }> = {
  white: { petal: "#fffdf7", edge: "#f4c3d6" },
  pink: { petal: "#fdd3e1", edge: "#ee8fb0" },
  yellow: { petal: "#fde9a0", edge: "#eec25a" },
  lavender: { petal: "#ded1fa", edge: "#b29be9" },
  red: { petal: "#f08a9c", edge: "#c2334f" },
  blue: { petal: "#c5e0fa", edge: "#86b6ec" },
};

/** What the creator chooses for a scene, beyond its text. Kept in the gift's theme. */
export const giftSceneSchema = z.object({
  flower: flowerColorSchema.default("white"),
});
export type GiftScene = z.infer<typeof giftSceneSchema>;

export const defaultScene: GiftScene = { flower: "white" };

/** What the scene's frame is sent. Mirrors `normalise` in the scene's js/config.js. */
export type SceneConfig = {
  name: string;
  /** Each page is a few short lines, typed one after the other. The last page stays. */
  pages: string[][];
  tapHint: string;
  flower: FlowerColor;
};

const lines = (text: string) =>
  text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);

/**
 * Turns a gift's sections into what the scene shows: the first heading is
 * the name, every message is a page, and a closing becomes the last page.
 */
export function sceneConfig(
  sections: Section[],
  scene: GiftScene | undefined,
  names: { recipient: string; sender: string },
  tapHint: string,
): SceneConfig {
  const heading = sections.find((s) => s.type === "text");
  const pages: string[][] = [];
  for (const s of sections) {
    if (s.type === "message") pages.push(lines(s.content.text));
    if (s.type === "final_message") {
      pages.push([...lines(s.content.text), s.content.signature.trim() || names.sender.trim()].filter(Boolean));
    }
  }
  return {
    name: (heading?.type === "text" ? heading.content.heading.trim() : "") || names.recipient.trim(),
    pages: pages.filter((page) => page.length > 0),
    tapHint,
    flower: scene?.flower ?? defaultScene.flower,
  };
}
