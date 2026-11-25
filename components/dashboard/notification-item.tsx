import {
  Bell,
  ChevronRight,
  CircleAlert,
  Crown,
  MailOpen,
  MessageCircleHeart,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/database";

const KINDS: Record<
  string,
  {
    key: "giftOpened" | "responseReceived" | "giftDisabled" | "paymentApproved" | "paymentRejected";
    icon: LucideIcon;
  }
> = {
  giftOpened: { key: "giftOpened", icon: MailOpen },
  responseReceived: { key: "responseReceived", icon: MessageCircleHeart },
  giftDisabled: { key: "giftDisabled", icon: ShieldAlert },
  paymentApproved: { key: "paymentApproved", icon: Crown },
  paymentRejected: { key: "paymentRejected", icon: CircleAlert },
};

/**
 * One notification as a row: an icon for what happened, the sentence, when,
 * and a dot while it is unread. A notification about a gift is a link to
 * that gift's page; an approved payment opens the template, a rejected one
 * its buy page. Used by the home screen's "Lately" and by the inbox.
 */
export async function NotificationItem({ notification: n }: { notification: Notification }) {
  const t = await getTranslations("dashboard.notifications");
  const format = await getFormatter();
  const locale = await getLocale();
  const kind = KINDS[n.title_key];
  const Icon = kind?.icon ?? Bell;
  const payload = (n.payload ?? {}) as {
    giftTitle?: string;
    reason?: string;
    summary?: string;
    templateSlug?: string;
    templateName?: string;
    templateNameMy?: string;
  };
  const templateName =
    (locale === "my" ? payload.templateNameMy : payload.templateName) ?? payload.templateName ?? "";
  const href = n.gift_id
    ? `/dashboard/gifts/${n.gift_id}`
    : payload.templateSlug && n.title_key === "paymentApproved"
      ? `/create?template=${encodeURIComponent(payload.templateSlug)}`
      : payload.templateSlug && n.title_key === "paymentRejected"
        ? `/dashboard/buy/${encodeURIComponent(payload.templateSlug)}`
        : null;
  // A reply's answers in a few words (migration 0021); a moderation reason otherwise.
  const detail = payload.summary || payload.reason;
  const unread = !n.read_at;

  const row = (
    <span
      className={cn(
        "flex items-center gap-3.5 rounded-2xl px-3 py-3 transition-colors",
        href && "hover:bg-secondary/60",
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full",
          unread
            ? "bg-brand-soft text-accent-foreground dark:text-brand"
            : "bg-secondary text-muted-foreground",
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm", unread && "font-semibold")}>
          {t(`titles.${kind?.key ?? "generic"}`, {
            giftTitle: payload.giftTitle ?? "",
            templateName,
          })}
        </span>
        {detail && (
          <span className="block truncate text-sm text-muted-foreground" title={detail}>
            {detail}
          </span>
        )}
        <span className="block text-xs text-muted-foreground">
          {format.relativeTime(new Date(n.created_at))}
        </span>
      </span>
      {unread && <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-brand" />}
      {href && (
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      )}
    </span>
  );

  return href ? (
    <Link href={href} className="block rounded-2xl">
      {row}
    </Link>
  ) : (
    row
  );
}
