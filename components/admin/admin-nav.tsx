"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LinkPending } from "@/components/ui/link-pending";
import { cn } from "@/lib/utils";

const items = [
  { key: "overview", href: "/admin" },
  // The daily task, so it sits where a phone shows it without scrolling.
  { key: "payments", href: "/admin/payments" },
  { key: "users", href: "/admin/users" },
  { key: "templates", href: "/admin/templates" },
  { key: "reports", href: "/admin/reports" },
  { key: "audit", href: "/admin/audit" },
  { key: "points", href: "/admin/points" },
] as const;

/** The admin tabs. Payments carries how many are waiting, so none is missed. */
export function AdminNav({ pendingPayments = 0 }: { pendingPayments?: number }) {
  const pathname = usePathname();
  const t = useTranslations("admin.nav");
  return (
    <nav aria-label="Admin" className="-mb-px flex gap-2 overflow-x-auto">
      {items.map(({ key, href }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm font-semibold transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t(key)}
            {key === "payments" && pendingPayments > 0 && (
              <span
                aria-label={t("waiting", { count: pendingPayments })}
                className="grid min-w-5 place-items-center rounded-full bg-brand-soft px-1.5 text-xs font-bold text-accent-foreground dark:text-brand"
              >
                {pendingPayments}
              </span>
            )}
            <LinkPending className="size-3" />
          </Link>
        );
      })}
    </nav>
  );
}
