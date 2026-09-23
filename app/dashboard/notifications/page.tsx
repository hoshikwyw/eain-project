import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function NotificationsPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.notifications")} />
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          {t("notificationsEmpty")}
        </CardContent>
      </Card>
    </div>
  );
}
