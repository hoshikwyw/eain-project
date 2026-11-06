import { Bell, ChevronRight, MailOpen, MessageCircleHeart, ShieldAlert, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/database";

const KINDS: Record<string, { key: "giftOpened" | "responseReceived" | "giftDisabled"; icon: LucideIcon }> = {
  giftOpened: { key: "giftOpened", icon: MailOpen },
  responseReceived: { key: "responseReceived", icon: MessageCircleHeart },
  giftDisabled: { key: "giftDisabled", icon: ShieldAlert },
};

/**
 * One notification as a row: an icon for what happened, the sentence, when,
 * and a dot while it is unread. A notification about a gift is a link to
 * that gift's page. Used by the home screen's "Lately" and by the inbox.
 */
export async function NotificationItem({ notification: n }: { notification: Notification }) {
  const t = await getTranslations("dashboard.notifications");
  const format = await getFormatter();
  const kind = KINDS[n.title_key];
  const Icon = kind?.icon ?? Bell;
  const payload = (n.payload ?? {}) as { giftTitle?: string; reason?: string };
  const unread = !n.read_at;

  const row = (
    <span className={cn("flex items-center gap-3.5 rounded-2xl px-3 py-3 transition-colors", n.gift_id && "hover:bg-secondary/60")}>
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full",
          unread ? "bg-brand-soft text-accent-foreground dark:text-brand" : "bg-secondary text-muted-foreground",
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm", unread && "font-semibold")}>{t(`titles.${kind?.key ?? "generic"}`, { giftTitle: payload.giftTitle ?? "" })}</span>
        {payload.reason && <span className="block text-sm text-muted-foreground">{payload.reason}</span>}
        <span className="block text-xs text-muted-foreground">{format.relativeTime(new Date(n.created_at))}</span>
      </span>
      {unread && <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-brand" />}
      {n.gift_id && <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}
    </span>
  );

  return n.gift_id ? (
    <Link href={`/dashboard/gifts/${n.gift_id}`} className="block rounded-2xl">
      {row}
    </Link>
  ) : (
    row
  );
}
