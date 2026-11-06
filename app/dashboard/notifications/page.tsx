import { CheckCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Bird } from "@/components/brand/lovebirds";
import { NotificationItem } from "@/components/dashboard/notification-item";
import { SubmitButton } from "@/components/ui/submit-button";
import { markAllNotificationsRead } from "@/features/notifications/actions";
import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/types/database";

/** One group of the inbox: a small heading and its rows in a panel. */
function Group({ title, items }: { title: string; items: Notification[] }) {
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase my:tracking-normal my:normal-case">{title}</h2>
      <ul className="flex flex-col divide-y divide-border rounded-3xl border border-border bg-card p-1.5 shadow-soft">
        {items.map((n) => (
          <li key={n.id}>
            <NotificationItem notification={n} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Notifications as an inbox: what is new on top, what has been read below.
 * A notification about a gift opens that gift.
 */
export default async function NotificationsPage() {
  const t = await getTranslations("dashboard");
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const items = notifications ?? [];
  const unread = items.filter((n) => !n.read_at);
  const read = items.filter((n) => n.read_at);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">{t("nav.notifications")}</h1>
          {items.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {unread.length > 0 ? t("notifications.unread", { count: unread.length }) : t("notifications.allRead")}
            </p>
          )}
        </div>
        {unread.length > 0 && (
          <form action={markAllNotificationsRead}>
            <SubmitButton variant="secondary" size="sm" className="rounded-full">
              <CheckCheck />
              {t("notifications.markAllRead")}
            </SubmitButton>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border px-6 py-12 text-center">
          <Bird variant="blue" className="w-20" />
          <p className="max-w-xs text-sm text-muted-foreground">{t("notificationsEmpty")}</p>
        </div>
      ) : (
        <>
          <Group title={t("notifications.new")} items={unread} />
          <Group title={t("notifications.earlier")} items={read} />
        </>
      )}
    </div>
  );
}
