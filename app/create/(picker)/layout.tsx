import type { Metadata } from "next";
import { AppShell } from "@/components/dashboard/app-shell";

/** Signed-in pages are private: nothing here belongs in a search result. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * The template picker sits in the same frame as the home pages. It is in
 * its own group so the editor next to it (/create/[giftId]) keeps the
 * whole screen to itself.
 */
export default function PickerLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
