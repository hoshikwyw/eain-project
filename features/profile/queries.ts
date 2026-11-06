import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient, createClientWithUser } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/**
 * Signed-in user's profile. Cached per request so layout and page share one query.
 * Redirects to login when signed out; proxy.ts normally catches that first.
 */
export const getCurrentProfile = cache(async (): Promise<Profile> => {
  const { supabase, user } = await createClientWithUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  // The trigger creates the profile at sign-up. Missing means the migration
  // was not applied; surface it instead of rendering a broken page.
  if (!profile) throw new Error("Profile not found. Have the database migrations been applied?");

  return profile;
});

export type DashboardStats = {
  giftsCreated: number;
  published: number;
  opened: number;
  responses: number;
};

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = await createClient();

  // Opens and replies are counted over this user's gifts by id, not left to
  // RLS alone: an admin may read everyone's, and these are personal numbers.
  const { data: mine } = await supabase.from("gifts").select("id").eq("sender_id", userId);
  const giftIds = (mine ?? []).map((g) => g.id);

  const [gifts, published, openedEvents, responses] = await Promise.all([
    supabase
      .from("gifts")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", userId)
      .neq("status", "deleted"),
    supabase
      .from("gifts")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", userId)
      .eq("status", "published"),
    supabase.from("gift_events").select("gift_id").eq("event_type", "opened").in("gift_id", giftIds),
    supabase.from("gift_responses").select("id", { count: "exact", head: true }).in("gift_id", giftIds),
  ]);

  const openedGiftIds = new Set((openedEvents.data ?? []).map((e) => e.gift_id));

  return {
    giftsCreated: gifts.count ?? 0,
    published: published.count ?? 0,
    opened: openedGiftIds.size,
    responses: responses.count ?? 0,
  };
}
