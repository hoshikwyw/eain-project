import type { Metadata } from "next";
import { AppShell } from "@/components/dashboard/app-shell";

/** Signed-in pages are private: nothing here belongs in a search result. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return <AppShell>{children}</AppShell>;
}
