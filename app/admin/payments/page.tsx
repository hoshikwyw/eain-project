import { getFormatter, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { listPayments, requireAdmin } from "@/features/admin/queries";

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const t = await getTranslations("admin");
  const format = await getFormatter();
  const payments = await listPayments();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.payments")} subtitle={t("payments.subtitle")} />
      <p className="rounded-xl bg-accent px-3.5 py-2.5 text-sm text-accent-foreground">{t("payments.off")}</p>
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold">
                    {p.provider} · {p.provider_reference}
                  </p>
                  <p className="text-xs text-muted-foreground">{format.dateTime(new Date(p.created_at), { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span>{format.number(p.amount_mmk)} MMK</span>
                  <Chip tone="brand">+{p.points}</Chip>
                  <Chip tone="neutral">{p.status}</Chip>
                </div>
              </li>
            ))}
            {payments.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">{t("payments.empty")}</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
