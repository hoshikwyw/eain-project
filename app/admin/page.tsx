import { Flag, Gift, Image as ImageIcon, MessageCircleHeart, Send, Star, Users } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatTile } from "@/components/dashboard/stat-tile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminStats } from "@/features/admin/queries";

/** Free-tier ceilings as published for the Supabase free plan. Re-check before launch. */
const LIMITS = {
  storageBytes: 1 * 1024 * 1024 * 1024,
  dbBytes: 500 * 1024 * 1024,
  monthlyActiveUsers: 50_000,
};

export default async function AdminOverviewPage() {
  const t = await getTranslations("admin");
  const format = await getFormatter();
  const stats = await getAdminStats();

  const usage = [
    { key: "storage", used: stats.media_bytes, limit: LIMITS.storageBytes },
    { key: "database", used: stats.db_bytes, limit: LIMITS.dbBytes },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("overview.title")} subtitle={t("overview.subtitle")} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={t("overview.users")} value={stats.users} icon={Users} />
        <StatTile label={t("overview.gifts")} value={stats.gifts} icon={Gift} />
        <StatTile label={t("overview.published")} value={stats.published} icon={Send} />
        <StatTile label={t("overview.opened")} value={stats.opened_gifts} icon={Send} />
        <StatTile label={t("overview.responses")} value={stats.responses} icon={MessageCircleHeart} />
        <StatTile label={t("overview.publishedWeek")} value={stats.published_last_7_days} icon={Gift} />
        <StatTile label={t("overview.points")} value={stats.points_in_circulation} icon={Star} />
        <StatTile label={t("overview.photos")} value={stats.media_count} icon={ImageIcon} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={stats.open_reports > 0 ? "border-primary/50" : ""}>
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flag className="size-4" />
                {t("overview.openReports", { count: stats.open_reports })}
              </CardTitle>
              <CardDescription>{t("overview.reportsHint")}</CardDescription>
            </div>
            <Button asChild size="sm" variant={stats.open_reports > 0 ? "primary" : "secondary"}>
              <Link href="/admin/reports">{t("overview.review")}</Link>
            </Button>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("overview.usageTitle")}</CardTitle>
            <CardDescription>{t("overview.usageHint")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {usage.map((u) => {
              const pct = Math.min(100, Math.round((u.used / u.limit) * 100));
              return (
                <div key={u.key} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{t(`overview.usage.${u.key}`)}</span>
                    <span className="text-muted-foreground">
                      {format.number(u.used / 1024 / 1024, { maximumFractionDigits: 1 })} / {format.number(u.limit / 1024 / 1024, { maximumFractionDigits: 0 })} MB
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={pct > 80 ? "h-full bg-destructive" : "h-full bg-primary"} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <li>
                <a className="text-primary underline-offset-4 hover:underline" href="https://supabase.com/dashboard/project/_/settings/billing/usage" target="_blank" rel="noreferrer">
                  {t("overview.usage.supabase")}
                </a>
              </li>
              <li>
                <a className="text-primary underline-offset-4 hover:underline" href="https://vercel.com/dashboard/usage" target="_blank" rel="noreferrer">
                  {t("overview.usage.vercel")}
                </a>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">{t("overview.usage.note")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
