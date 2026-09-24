import { en } from "./en";
import { my } from "./my";
import type { LegalContent, LegalDoc, LegalKey } from "./types";

const byLocale: Record<"en" | "my", LegalContent> = { en, my };

export function getLegalDoc(locale: string, key: LegalKey): LegalDoc {
  return (byLocale[locale === "my" ? "my" : "en"] ?? en)[key];
}

export type { LegalDoc, LegalKey } from "./types";
