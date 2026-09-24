"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { Chip } from "@/components/ui/chip";
import { LinkPending } from "@/components/ui/link-pending";
import { cn } from "@/lib/utils";
import { isActivePath, navItems } from "./nav-items";

type Props = {
  displayName: string;
  email: string;
  pointsBalance: number;
  unreadCount: number;
  isAdmin?: boolean;
};

export function Sidebar({ displayName, email, pointsBalance, unreadCount, isAdmin }: Props) {
  const pathname = usePathname();
  const t = useTranslations("dashboard.nav");

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card p-4 md:flex">
      <Link href="/" aria-label="Eain" className="px-2 py-1">
        <Logo />
      </Link>

      <nav className="mt-6 flex flex-1 flex-col gap-1" aria-label="Dashboard">
        {navItems.map(({ key, href, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-accent text-accent-foreground dark:bg-secondary dark:text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="size-4.5" />
              <span className="flex-1">{t(key)}</span>
              <LinkPending />
              {key === "points" && <Chip tone="brand">{pointsBalance}</Chip>}
              {key === "notifications" && unreadCount > 0 && <Chip tone="brand">{unreadCount}</Chip>}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/admin"
            className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ShieldCheck className="size-4.5" />
            {t("admin")}
          </Link>
        )}
      </nav>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-border p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-accent-foreground dark:text-brand">
          {displayName.trim().charAt(0).toUpperCase() || "E"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </div>
    </aside>
  );
}
