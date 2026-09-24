import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/legal-page";
import { getLegalDoc } from "@/content/legal";

export async function generateMetadata(): Promise<Metadata> {
  const doc = getLegalDoc(await getLocale(), "cookies");
  return { title: doc.title, description: doc.intro };
}

export default async function CookiesPage() {
  return <LegalPage doc={getLegalDoc(await getLocale(), "cookies")} current="cookies" />;
}
