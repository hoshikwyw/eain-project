import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminFlash } from "@/components/admin/flash";
import { PageHeader } from "@/components/dashboard/page-header";
import { TemplatePreview } from "@/components/templates/template-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateTemplateDetails } from "@/features/admin/actions";
import { getTemplateAdmin, listCategoriesAdmin, requireAdmin } from "@/features/admin/queries";
import { getTemplateStyle, isAvailableTemplate } from "@/features/gifts/templates";

const textareaClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";
const selectClass =
  "h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

export default async function AdminTemplateEditPage({ params, searchParams }: PageProps<"/admin/templates/[templateId]">) {
  await requireAdmin();
  const { templateId } = await params;
  const query = await searchParams;
  const t = await getTranslations("admin");
  const [tp, categories] = await Promise.all([getTemplateAdmin(templateId), listCategoriesAdmin()]);
  if (!tp) notFound();

  const style = getTemplateStyle(tp.slug);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={tp.name_en}
        subtitle={`${tp.slug} · ${t(`templates.designs.${style.design}`)}`}
        action={
          <Button asChild variant="secondary" size="sm">
            <Link href="/admin/templates">
              <ArrowLeft />
              {t("templates.back")}
            </Link>
          </Button>
        }
      />
      <AdminFlash ok={typeof query.ok === "string" ? query.ok : undefined} error={typeof query.error === "string" ? query.error : undefined} />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>{t("templates.details")}</CardTitle>
            <CardDescription>{t("templates.detailsHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateTemplateDetails} className="flex flex-col gap-5">
              <input type="hidden" name="templateId" value={tp.id} />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("templates.fields.nameEn")} htmlFor="nameEn">
                  <Input id="nameEn" name="nameEn" defaultValue={tp.name_en} maxLength={80} required />
                </Field>
                <Field label={t("templates.fields.nameMy")} htmlFor="nameMy">
                  <Input id="nameMy" name="nameMy" lang="my" defaultValue={tp.name_my} maxLength={80} required />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("templates.fields.descriptionEn")} htmlFor="descriptionEn">
                  <textarea id="descriptionEn" name="descriptionEn" rows={3} maxLength={300} defaultValue={tp.description_en} className={textareaClass} />
                </Field>
                <Field label={t("templates.fields.descriptionMy")} htmlFor="descriptionMy">
                  <textarea id="descriptionMy" name="descriptionMy" lang="my" rows={3} maxLength={300} defaultValue={tp.description_my} className={textareaClass} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("templates.fields.category")} htmlFor="categoryId">
                  <select id="categoryId" name="categoryId" defaultValue={tp.category_id} className={selectClass}>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_en}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("templates.fields.sortOrder")} htmlFor="sortOrder" hint={t("templates.fields.sortOrderHint")}>
                  <Input id="sortOrder" name="sortOrder" type="number" min={0} max={9999} defaultValue={tp.sort_order} />
                </Field>
              </div>

              <fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
                <legend className="px-1 text-sm font-semibold">{t("templates.fields.visibility")}</legend>
                <Toggle name="isActive" defaultChecked={tp.is_active} label={t("templates.active")} hint={t("templates.fields.activeHint")} />
                <Toggle name="isFeatured" defaultChecked={tp.is_featured} label={t("templates.featured")} hint={t("templates.fields.featuredHint")} />
              </fieldset>

              <fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
                <legend className="px-1 text-sm font-semibold">{t("templates.fields.pricing")}</legend>
                <Toggle name="isPremium" defaultChecked={tp.is_premium} label={t("templates.premium")} hint={t("templates.fields.premiumHint")} />
                <Field label={t("templates.price")} htmlFor="pointPrice">
                  <Input id="pointPrice" name="pointPrice" type="number" min={0} max={100000} defaultValue={tp.point_price} className="max-w-40" />
                </Field>
              </fieldset>

              <SubmitButton className="self-start">{t("templates.save")}</SubmitButton>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("templates.preview")}</CardTitle>
              <CardDescription>{t("templates.previewHint")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <TemplatePreview slug={tp.slug} variant={style.defaultVariant} locale="en" name={tp.name_en} />
              <TemplatePreview slug={tp.slug} variant={style.defaultVariant} locale="my" name={tp.name_my} />
              <div className="flex flex-wrap gap-1.5">
                <Chip tone="neutral">{t(`templates.designs.${style.design}`)}</Chip>
                <Chip tone="neutral">{style.layout}</Chip>
                <Chip tone="neutral">{style.defaultVariant}</Chip>
                {!isAvailableTemplate(tp.slug) && <Chip tone="brand">{t("templates.noLayout")}</Chip>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("templates.usage")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-muted/60 p-3">
                  <dt className="text-xs text-muted-foreground">{t("templates.stats.gifts")}</dt>
                  <dd className="font-display text-2xl font-semibold">{tp.stats.gifts}</dd>
                </div>
                <div className="rounded-xl bg-muted/60 p-3">
                  <dt className="text-xs text-muted-foreground">{t("templates.stats.published")}</dt>
                  <dd className="font-display text-2xl font-semibold">{tp.stats.published}</dd>
                </div>
                <div className="rounded-xl bg-muted/60 p-3">
                  <dt className="text-xs text-muted-foreground">{t("templates.stats.unlocks")}</dt>
                  <dd className="font-display text-2xl font-semibold">{tp.stats.unlocks}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Toggle({ name, defaultChecked, label, hint }: { name: string; defaultChecked: boolean; label: string; hint: string }) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 size-4 accent-primary" />
      <span>
        <span className="font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}
