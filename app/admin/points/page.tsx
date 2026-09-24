import { getFormatter, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { listRecentTransactions, requireAdmin } from "@/features/admin/queries";

export default async function AdminPointsPage() {
  await requireAdmin();
  const t = await getTranslations("admin");
  const format = await getFormatter();
  const tx = await listRecentTransactions();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.points")} subtitle={t("points.subtitle")} />
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {tx.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {row.userName} <span className="font-normal text-muted-foreground">· {row.description}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format.dateTime(new Date(row.created_at), { dateStyle: "medium", timeStyle: "short" })}
                    {row.reference_type && ` · ${row.reference_type}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Chip tone="neutral">{row.type}</Chip>
                  <Chip tone={row.amount > 0 ? "success" : "brand"}>{row.amount > 0 ? `+${row.amount}` : row.amount}</Chip>
                  <span className="w-14 text-right text-xs text-muted-foreground">= {row.balance_after}</span>
                </div>
              </li>
            ))}
            {tx.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">{t("points.empty")}</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
