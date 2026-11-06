import type { Metadata } from "next";
import { AppHeader } from "@/components/dashboard/app-header";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { getCurrentProfile } from "@/features/profile/queries";
import { createClient } from "@/lib/supabase/server";

/** Signed-in pages are private: nothing here belongs in a search result. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: userData }, unread] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
  ]);

  const unreadCount = unread.count ?? 0;

  return (
    // One column like the public site: a bar on top, the page under it, and
    // on phones a tab bar at the bottom.
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader
        displayName={profile.display_name}
        email={userData.user?.email ?? ""}
        pointsBalance={profile.points_balance}
        unreadCount={unreadCount}
        isAdmin={profile.role === "admin"}
      />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 md:py-10">
        {children}
      </main>
      <BottomNav unreadCount={unreadCount} />
    </div>
  );
}
