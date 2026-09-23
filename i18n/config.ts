export const locales = ["en", "my"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Preference cookie. Holds only "en" or "my". No personal data. */
export const LOCALE_COOKIE = "EAIN_LOCALE";

export function isLocale(value: string | undefined | null): value is Locale {
  return locales.includes(value as Locale);
}

/**
 * Picks a locale from an Accept-Language header.
 * Myanmar-first: any Burmese preference wins, otherwise English.
 */
export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return defaultLocale;
  const wantsBurmese = header
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase() ?? "")
    .some((tag) => tag === "my" || tag.startsWith("my-"));
  return wantsBurmese ? "my" : defaultLocale;
}
