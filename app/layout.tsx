import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { SkipLink } from "@/components/layout/skip-link";
import { ThemeProvider } from "@/components/settings/theme-provider";
import { appMode } from "@/lib/app-mode";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

/** What people search for when they want this. Search engines give it little weight; it costs nothing. */
const KEYWORDS = [
  "digital gift",
  "online greeting card",
  "e-card maker",
  "birthday card online",
  "thank you card",
  "anniversary card",
  "animated greeting card",
  "Myanmar greeting card",
  "Burmese e-card",
  "မွေးနေ့ကတ်",
  "ဒစ်ဂျစ်တယ် လက်ဆောင်",
];

/**
 * Defaults for every page. A page that sets its own title or description
 * gets the same in its link preview; the preview picture is
 * app/opengraph-image.png unless a page names another.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("brand");
  const locale = await getLocale();
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  const verification = process.env.GOOGLE_SITE_VERIFICATION;
  return {
    metadataBase: site ? new URL(site) : undefined,
    title: { default: t("seoTitle"), template: "%s · Eain" },
    description: t("seoDescription"),
    applicationName: "Eain",
    keywords: KEYWORDS,
    openGraph: { siteName: "Eain", type: "website", locale: locale === "my" ? "my_MM" : "en_US" },
    twitter: { card: "summary_large_image" },
    // The admin console is never for search engines. Private pages on the
    // user site are kept out by robots.txt and by their own layouts.
    robots:
      appMode === "admin"
        ? { index: false, follow: false }
        : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    verification: verification ? { google: verification } : undefined,
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#170d1b" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${fontVariables} h-full antialiased`} suppressHydrationWarning>
      {/* Browser extensions (ColorZilla, Grammarly) add attributes to body before React loads. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <NextIntlClientProvider>
          <ThemeProvider>
            <SkipLink />
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
