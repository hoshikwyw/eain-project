"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const items = [
  { key: "overview", href: "/admin" },
  { key: "users", href: "/admin/users" },
  { key: "templates", href: "/admin/templates" },
  { key: "reports", href: "/admin/reports" },
  { key: "points", href: "/admin/points" },
  { key: "payments", href: "/admin/payments" },
  { key: "audit", href: "/admin/audit" },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const t = useTranslations("admin.nav");
  return (
    <nav aria-label="Admin" className="-mb-px flex gap-1 overflow-x-auto">
      {items.map(({ key, href }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors",
              active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
