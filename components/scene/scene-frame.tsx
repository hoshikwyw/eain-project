"use client";

import { useEffect, useRef } from "react";
import { SCENE_SRC, type SceneConfig, type SceneKind } from "@/features/gifts/scene";
import { caveat, jakarta, notoSansMyanmar } from "@/lib/fonts";
import { cn } from "@/lib/utils";

type SceneFonts = { css: string; body: string; script: string };

let cachedFonts: SceneFonts | null = null;

const familyNames = (fontFamily: string) => fontFamily.split(",").map((f) => f.trim().replace(/^["']|["']$/g, ""));

/**
 * The app's own fonts for the scene: the @font-face rules of the faces it
 * uses, with their file addresses made absolute, and the families to use.
 * The scene is a separate page, so it cannot see this page's fonts, and it
 * must not fetch any from another site.
 */
function sceneFonts(): SceneFonts {
  if (cachedFonts) return cachedFonts;
  const families = [jakarta, caveat, notoSansMyanmar].map((f) => f.style.fontFamily);
  const wanted = new Set(families.flatMap(familyNames));
  let css = "";
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // a stylesheet from another origin cannot be read
    }
    const base = sheet.href ?? window.location.href;
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      if (!familyNames(rule.style.getPropertyValue("font-family")).some((name) => wanted.has(name))) continue;
      css += rule.cssText.replace(/url\((["']?)([^"')]+)\1\)/g, (_match, _quote, url: string) => `url("${new URL(url, base).href}")`);
    }
  }
  const myanmar = notoSansMyanmar.style.fontFamily;
  cachedFonts = {
    css,
    body: `${jakarta.style.fontFamily}, ${myanmar}, system-ui, sans-serif`,
    script: `${caveat.style.fontFamily}, ${myanmar}, cursive`,
  };
  return cachedFonts;
}

type Props = {
  kind: SceneKind;
  config: SceneConfig;
  /** Said to screen readers in place of the animation. */
  title: string;
  className?: string;
};

/**
 * An animated scene in its own frame. The scene asks for its content once it
 * has loaded and this answers; the content is read when it asks, so to show
 * new content give the frame a new `key`, which starts the scene again.
 */
export function SceneFrame({ kind, config, title, className }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(config);

  useEffect(() => {
    latest.current = config;
  }, [config]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const target = frame.current?.contentWindow;
      // Only this frame, on this site, is answered.
      if (!target || e.source !== target || e.origin !== window.location.origin) return;
      if ((e.data as { type?: unknown } | null)?.type !== "eain:scene-ready") return;
      target.postMessage({ type: "eain:scene-config", config: latest.current, fonts: sceneFonts() }, window.location.origin);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return <iframe ref={frame} src={SCENE_SRC[kind]} title={title} className={cn("block size-full border-0", className)} />;
}
