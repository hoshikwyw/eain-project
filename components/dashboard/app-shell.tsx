import { getCurrentProfile } from "@/features/profile/queries";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "./app-header";
import { BottomNav } from "./bottom-nav";

/**
 * The frame around every signed-in page: the bar on top, the page under
 * it, and on phones the tab bar at the bottom. One column, like the public
 * site. Used by the layouts of the home pages and of the template picker,
 * so moving between them never changes the frame.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: userData }, unread] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
  ]);
  const unreadCount = unread.count ?? 0;

  return (
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
