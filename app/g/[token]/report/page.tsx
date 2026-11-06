import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { ReportForm } from "@/components/gift/report-form";
import { PageTitle } from "@/components/ui/page-title";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("report");
  return { title: t("title"), robots: { index: false, follow: false } };
}

/** Report page for a gift link. Renders for any token; the action checks it. */
export default async function ReportGiftPage({ params }: PageProps<"/g/[token]/report">) {
  const { token } = await params;
  const t = await getTranslations("report");

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-8 sm:py-12">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/g/${token}`}
          className="inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("back")}
        </Link>
        <Link href="/" aria-label="Eain" className="rounded-lg">
          <Logo />
        </Link>
      </div>
      <div>
        <PageTitle>{t("title")}</PageTitle>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>
      <ReportForm token={token} />
    </div>
  );
}
