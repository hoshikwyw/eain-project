import { getFormatter, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { getCurrentProfile } from "@/features/profile/queries";
import { createClient } from "@/lib/supabase/server";

export default async function PointsPage() {
  const t = await getTranslations("dashboard");
  const format = await getFormatter();
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: transactions } = await supabase
    .from("point_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.points")} subtitle={t("points.subtitle")} />

      <Card className="bg-hero">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="font-display text-5xl font-semibold">{profile.points_balance}</p>
            <p className="text-sm text-muted-foreground">{t("points.total")}</p>
          </div>
          <Button disabled variant="secondary">
            {t("points.buy")} · {t("comingSoon")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("points.history")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {(transactions ?? []).map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{tx.description || t(`points.types.${tx.type}`)}</p>
                  <p className="text-xs text-muted-foreground">
                    {format.dateTime(new Date(tx.created_at), { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <Chip tone={tx.amount > 0 ? "success" : "neutral"}>
                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                </Chip>
              </li>
            ))}
            {(transactions ?? []).length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">{t("points.empty")}</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
