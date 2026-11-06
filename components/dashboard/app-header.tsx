"use client";

import { Bell, Plus, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { LinkPending } from "@/components/ui/link-pending";
import { cn } from "@/lib/utils";
import { isActivePath, navItems, topNavKeys } from "./nav-items";
import { UserMenu } from "./user-menu";

type Props = {
  displayName: string;
  email: string;
  pointsBalance: number;
  unreadCount: number;
  isAdmin?: boolean;
};

/**
 * The bar across the top of every signed-in page, in the same style as the
 * public site's header so signing in does not feel like entering a
 * different product. Wide screens get the main links, a create button, the
 * points balance and the notification bell; phones get the logo and the
 * avatar, since their bottom bar carries the rest.
 */
export function AppHeader({ displayName, email, pointsBalance, unreadCount, isAdmin }: Props) {
  const pathname = usePathname();
  const t = useTranslations("dashboard");
  const links = topNavKeys.map((key) => navItems.find((item) => item.key === key)!);
  const onNotifications = isActivePath(pathname, "/dashboard/notifications");

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 md:h-[4.5rem]">
        <Link href="/dashboard" aria-label="Eain" className="rounded-lg">
          <Logo />
        </Link>

        <nav aria-label={t("nav.main")} className="ml-6 hidden items-center gap-1 md:flex">
          {links.map(({ key, href }) => {
            const active = isActivePath(pathname, href);
            return (
              <Link
                key={key}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`nav.${key}`)}
                <LinkPending className="size-3" />
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <Button asChild size="sm" className="rounded-full px-5 max-lg:hidden">
            <Link href="/create">
              <Plus />
              {t("createNewGift")}
            </Link>
          </Button>

          <Link
            href="/dashboard/points"
            aria-label={`${t("nav.points")}: ${pointsBalance}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-soft px-3.5 text-sm font-bold text-accent-foreground transition hover:brightness-95 max-md:hidden dark:text-brand dark:hover:brightness-110"
          >
            <Star className="size-4 fill-current" />
            {pointsBalance}
          </Link>

          <Link
            href="/dashboard/notifications"
            aria-label={unreadCount > 0 ? `${t("nav.notifications")}: ${unreadCount}` : t("nav.notifications")}
            aria-current={onNotifications ? "page" : undefined}
            className={cn(
              "relative grid size-9 place-items-center rounded-full transition-colors max-md:hidden",
              onNotifications ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Bell className="size-5" />
            {unreadCount > 0 && <span aria-hidden="true" className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-brand ring-2 ring-background" />}
          </Link>

          <UserMenu displayName={displayName} email={email} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}
