import { BottomNav } from "@/components/dashboard/bottom-nav";
import { Sidebar } from "@/components/dashboard/sidebar";
import { LocaleToggle } from "@/components/settings/locale-toggle";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { getCurrentProfile } from "@/features/profile/queries";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: userData }, unread] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
  ]);

  const unreadCount = unread.count ?? 0;

  return (
    <div className="flex min-h-full flex-1">
      <Sidebar
        displayName={profile.display_name}
        email={userData.user?.email ?? ""}
        pointsBalance={profile.points_balance}
        unreadCount={unreadCount}
        isAdmin={profile.role === "admin"}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center justify-end gap-1.5 border-b border-border px-4 md:h-16">
          <LocaleToggle />
          <ThemeToggle />
        </div>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-28 md:pb-10">{children}</main>
      </div>
      <BottomNav unreadCount={unreadCount} />
    </div>
  );
}
