import { getTranslations } from "next-intl/server";
import { AdminFlash } from "@/components/admin/flash";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { updateTemplate } from "@/features/admin/actions";
import { listTemplatesAdmin, requireAdmin } from "@/features/admin/queries";
import { isAvailableTemplate } from "@/features/gifts/templates";

export default async function AdminTemplatesPage({ searchParams }: PageProps<"/admin/templates">) {
  await requireAdmin();
  const params = await searchParams;
  const t = await getTranslations("admin");
  const templates = await listTemplatesAdmin();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.templates")} subtitle={t("templates.subtitle")} />
      <AdminFlash ok={typeof params.ok === "string" ? params.ok : undefined} error={typeof params.error === "string" ? params.error : undefined} />

      <ul className="flex flex-col gap-3">
        {templates.map((tp) => (
          <li key={tp.id}>
            <Card>
              <CardContent className="p-4">
                <form action={updateTemplate} className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <input type="hidden" name="templateId" value={tp.id} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{tp.name_en}</p>
                      <span className="text-sm text-muted-foreground" lang="my">
                        {tp.name_my}
                      </span>
                      <Chip tone="neutral">{tp.slug}</Chip>
                      {!isAvailableTemplate(tp.slug) && <Chip tone="brand">{t("templates.noLayout")}</Chip>}
                    </div>
                    <p className="text-xs text-muted-foreground">{tp.description_en}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" name="isActive" defaultChecked={tp.is_active} className="size-4 accent-primary" />
                      {t("templates.active")}
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" name="isFeatured" defaultChecked={tp.is_featured} className="size-4 accent-primary" />
                      {t("templates.featured")}
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" name="isPremium" defaultChecked={tp.is_premium} className="size-4 accent-primary" />
                      {t("templates.premium")}
                    </label>
                    <Input
                      name="pointPrice"
                      type="number"
                      min={0}
                      defaultValue={tp.point_price}
                      aria-label={t("templates.price")}
                      className="h-9 w-24 text-sm"
                    />
                    <Button type="submit" size="sm" variant="secondary">
                      {t("templates.save")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{t("templates.note")}</p>
    </div>
  );
}
