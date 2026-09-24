"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LinkPending } from "@/components/ui/link-pending";
import { cn } from "@/lib/utils";
import { isActivePath, mobileNavKeys, navItems } from "./nav-items";

export function BottomNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();
  const t = useTranslations("dashboard.nav");
  const items = mobileNavKeys.map((key) => navItems.find((item) => item.key === key)!);
  const [left, right] = [items.slice(0, 2), items.slice(2)];

  const renderItem = ({ key, href, icon: Icon }: (typeof items)[number]) => {
    const active = isActivePath(pathname, href);
    return (
      <Link
        key={key}
        href={href}
        aria-current={active ? "page" : undefined}
        aria-label={t(key)}
        className={cn(
          "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className="size-5" />
        <span>{t(key)}</span>
        <LinkPending className="absolute top-1 right-2 size-3" />
        {key === "notifications" && unreadCount > 0 && (
          <span className="absolute top-1.5 right-[calc(50%-14px)] size-2 rounded-full bg-brand" />
        )}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Dashboard"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch">
        {left.map(renderItem)}
        <Link
          href="/create"
          aria-label={t("create")}
          className="flex flex-1 items-center justify-center"
        >
          <span className="-mt-5 grid size-13 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft">
            <Plus className="size-6" />
          </span>
        </Link>
        {right.map(renderItem)}
      </div>
    </nav>
  );
}
