import { getFormatter, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { listAuditLogs, requireAdmin } from "@/features/admin/queries";

export default async function AdminAuditPage() {
  await requireAdmin();
  const t = await getTranslations("admin");
  const format = await getFormatter();
  const logs = await listAuditLogs();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.audit")} subtitle={t("audit.subtitle")} />
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {logs.map((l) => (
              <li key={l.id} className="flex flex-col gap-1 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip tone="primary">{l.action}</Chip>
                  <span className="font-semibold">{l.adminName}</span>
                  <span className="text-muted-foreground">
                    {l.target_type} {l.target_id}
                  </span>
                  <span className="text-xs text-muted-foreground">{format.dateTime(new Date(l.created_at), { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
                <code className="text-xs text-muted-foreground">{JSON.stringify(l.details)}</code>
              </li>
            ))}
            {logs.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">{t("audit.empty")}</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
