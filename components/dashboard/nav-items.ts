import { Bell, Gift, LayoutDashboard, LayoutTemplate, Settings, Star, type LucideIcon } from "lucide-react";

export type NavKey = "dashboard" | "gifts" | "templates" | "points" | "notifications" | "settings";

export type NavItem = { key: NavKey; href: string; icon: LucideIcon };

export const navItems: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "gifts", href: "/dashboard/gifts", icon: Gift },
  { key: "templates", href: "/templates", icon: LayoutTemplate },
  { key: "points", href: "/dashboard/points", icon: Star },
  { key: "notifications", href: "/dashboard/notifications", icon: Bell },
  { key: "settings", href: "/dashboard/settings", icon: Settings },
];

/** Five slots on mobile. Create sits in the middle. */
export const mobileNavKeys: NavKey[] = ["dashboard", "gifts", "points", "notifications"];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
