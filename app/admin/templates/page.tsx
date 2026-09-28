import { Pencil } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AdminFlash } from "@/components/admin/flash";
import { PageHeader } from "@/components/dashboard/page-header";
import { TemplatePreview } from "@/components/templates/template-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { listTemplatesAdmin, requireAdmin } from "@/features/admin/queries";
import { getTemplateStyle, isAvailableTemplate } from "@/features/gifts/templates";

export default async function AdminTemplatesPage({ searchParams }: PageProps<"/admin/templates">) {
  await requireAdmin();
  const params = await searchParams;
  const t = await getTranslations("admin");
  const templates = await listTemplatesAdmin();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.templates")} subtitle={t("templates.subtitle")} />
      <AdminFlash ok={typeof params.ok === "string" ? params.ok : undefined} error={typeof params.error === "string" ? params.error : undefined} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((tp) => (
          <Card key={tp.id} className={tp.is_active ? "" : "opacity-70"}>
            <CardContent className="flex h-full flex-col gap-4 p-4">
              <TemplatePreview slug={tp.slug} variant={getTemplateStyle(tp.slug).defaultVariant} locale="en" name={tp.name_en} />
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">#{tp.sort_order}</span>
                  <h2 className="font-semibold">{tp.name_en}</h2>
                </div>
                <p className="text-sm text-muted-foreground" lang="my">
                  {tp.name_my}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Chip tone={tp.is_active ? "success" : "neutral"}>{tp.is_active ? t("templates.active") : t("templates.inactive")}</Chip>
                {tp.is_featured && <Chip tone="brand">{t("templates.featured")}</Chip>}
                <Chip tone={tp.is_premium ? "primary" : "neutral"}>{tp.is_premium ? `${t("templates.premium")} · ${tp.point_price}` : t("templates.free")}</Chip>
                <Chip tone="neutral">{tp.categoryName}</Chip>
                {!isAvailableTemplate(tp.slug) && <Chip tone="brand">{t("templates.noLayout")}</Chip>}
              </div>
              <dl className="grid grid-cols-3 gap-2 rounded-xl bg-muted/60 p-3 text-center text-xs">
                <div>
                  <dt className="text-muted-foreground">{t("templates.stats.gifts")}</dt>
                  <dd className="text-base font-semibold">{tp.stats.gifts}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("templates.stats.published")}</dt>
                  <dd className="text-base font-semibold">{tp.stats.published}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("templates.stats.unlocks")}</dt>
                  <dd className="text-base font-semibold">{tp.stats.unlocks}</dd>
                </div>
              </dl>
              <Button asChild variant="secondary" className="mt-auto w-full">
                <Link href={`/admin/templates/${tp.id}`}>
                  <Pencil />
                  {t("templates.edit")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t("templates.note")}</p>
    </div>
  );
}
