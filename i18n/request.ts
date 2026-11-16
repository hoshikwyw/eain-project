import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { LOCALE_COOKIE, isLocale, localeFromAcceptLanguage } from "./config";

/**
 * Locale comes from a cookie, then the browser language.
 * There is no locale segment in URLs, so gift links stay short and
 * identical in every language.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;

  const locale = isLocale(fromCookie)
    ? fromCookie
    : localeFromAcceptLanguage((await headers()).get("accept-language"));

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    formats: {
      number: {
        // Numbers the app prints: Myanmar numerals in Burmese. The numbering
        // system is named outright because many browsers ship no Burmese
        // locale data and would otherwise fall back to Latin digits on the
        // client while the server had sent Myanmar ones.
        digits: locale === "my" ? { numberingSystem: "mymr" } : {},
      },
    },
  };
});
