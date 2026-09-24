import { Bell } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { markAllNotificationsRead } from "@/features/notifications/actions";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const KNOWN_TITLES = ["giftOpened", "responseReceived", "giftDisabled"] as const;

export default async function NotificationsPage() {
  const t = await getTranslations("dashboard");
  const format = await getFormatter();
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const items = notifications ?? [];
  const hasUnread = items.some((n) => !n.read_at);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.notifications")}
        action={
          hasUnread ? (
            <form action={markAllNotificationsRead}>
              <Button type="submit" variant="secondary" size="sm">
                {t("notifications.markAllRead")}
              </Button>
            </form>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">{t("notificationsEmpty")}</CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((n) => {
            const key = KNOWN_TITLES.find((k) => k === n.title_key) ?? "generic";
            const payload = (n.payload ?? {}) as { giftTitle?: string; reason?: string };
            const inner = (
              <Card className={cn(!n.read_at && "border-primary/40")}>
                <CardContent className="flex items-start gap-3 p-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-accent-foreground dark:text-brand">
                    <Bell className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", !n.read_at && "font-semibold")}>
                      {t(`notifications.titles.${key}`, { giftTitle: payload.giftTitle ?? "" })}
                    </p>
                    {payload.reason && <p className="text-sm text-muted-foreground">{payload.reason}</p>}
                    <p className="text-xs text-muted-foreground">{format.relativeTime(new Date(n.created_at))}</p>
                  </div>
                  {!n.read_at && <span className="mt-1.5 size-2 rounded-full bg-brand" aria-hidden="true" />}
                </CardContent>
              </Card>
            );
            return (
              <li key={n.id}>
                {n.gift_id ? (
                  <Link href={`/dashboard/gifts/${n.gift_id}`} className="block rounded-2xl">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
