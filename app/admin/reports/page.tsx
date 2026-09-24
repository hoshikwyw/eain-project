import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { AdminFlash } from "@/components/admin/flash";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { resolveReport } from "@/features/admin/actions";
import { listReports, requireAdmin } from "@/features/admin/queries";

export default async function AdminReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await requireAdmin();
  const params = await searchParams;
  const scope = params.scope === "all" ? "all" : "open";
  const t = await getTranslations("admin");
  const format = await getFormatter();
  const reports = await listReports(scope);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.reports")}
        subtitle={t("reports.subtitle")}
        action={
          <div className="flex gap-1">
            <Button asChild size="sm" variant={scope === "open" ? "primary" : "secondary"}>
              <Link href="/admin/reports">{t("reports.open")}</Link>
            </Button>
            <Button asChild size="sm" variant={scope === "all" ? "primary" : "secondary"}>
              <Link href="/admin/reports?scope=all">{t("reports.all")}</Link>
            </Button>
          </div>
        }
      />
      <AdminFlash ok={typeof params.ok === "string" ? params.ok : undefined} error={typeof params.error === "string" ? params.error : undefined} />

      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">{t("reports.empty")}</CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {reports.map((r) => (
            <li key={r.id}>
              <Card>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone={r.status === "open" ? "primary" : r.status === "reviewing" ? "brand" : "neutral"}>
                      {t(`reports.status.${r.status}`)}
                    </Chip>
                    <Chip tone="neutral">{t(`reports.reasons.${r.reason}`)}</Chip>
                    <span className="text-xs text-muted-foreground">
                      {format.dateTime(new Date(r.created_at), { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">
                      {r.gift ? r.gift.title : t("reports.giftGone")}
                      {r.gift && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">{t(`reports.giftStatus.${r.gift.status}`)}</span>
                      )}
                    </p>
                    {r.details && <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{r.details}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {r.gift && (
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/admin/gifts/${r.gift_id}`}>{t("reports.viewGift")}</Link>
                      </Button>
                    )}
                    {(r.status === "open" || r.status === "reviewing") && (
                      <>
                        {r.status === "open" && (
                          <form action={resolveReport}>
                            <input type="hidden" name="reportId" value={r.id} />
                            <input type="hidden" name="status" value="reviewing" />
                            <Button type="submit" size="sm" variant="ghost">
                              {t("reports.markReviewing")}
                            </Button>
                          </form>
                        )}
                        <form action={resolveReport}>
                          <input type="hidden" name="reportId" value={r.id} />
                          <input type="hidden" name="status" value="resolved" />
                          <Button type="submit" size="sm" variant="ghost">
                            {t("reports.resolve")}
                          </Button>
                        </form>
                        <form action={resolveReport}>
                          <input type="hidden" name="reportId" value={r.id} />
                          <input type="hidden" name="status" value="dismissed" />
                          <Button type="submit" size="sm" variant="ghost">
                            {t("reports.dismiss")}
                          </Button>
                        </form>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
