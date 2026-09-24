import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { SkipLink } from "@/components/layout/skip-link";
import { ThemeProvider } from "@/components/settings/theme-provider";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("brand");
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  return {
    metadataBase: site ? new URL(site) : undefined,
    title: { default: "Eain", template: "%s · Eain" },
    description: t("tagline"),
    applicationName: "Eain",
    openGraph: { siteName: "Eain", type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#120e2a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${fontVariables} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
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
