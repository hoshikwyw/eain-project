import { Bell, Gift, House, LayoutTemplate, Settings, type LucideIcon } from "lucide-react";

export type NavKey = "dashboard" | "gifts" | "templates" | "notifications" | "settings";

export type NavItem = { key: NavKey; href: string; icon: LucideIcon };

/**
 * Every signed-in destination. "dashboard" is the home screen; the key and
 * its address are kept from before it was called Home. Templates opens the
 * picker inside the app, where premium templates show their kyat price.
 */
export const navItems: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: House },
  { key: "gifts", href: "/dashboard/gifts", icon: Gift },
  { key: "templates", href: "/create", icon: LayoutTemplate },
  { key: "notifications", href: "/dashboard/notifications", icon: Bell },
  { key: "settings", href: "/dashboard/settings", icon: Settings },
];

/** Links in the top bar on wide screens. Notifications and settings have their own controls there. */
export const topNavKeys: NavKey[] = ["dashboard", "gifts", "templates"];

/** Five slots on mobile. Create (the template picker) sits in the middle. */
export const mobileNavKeys: NavKey[] = ["dashboard", "gifts", "notifications", "settings"];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
