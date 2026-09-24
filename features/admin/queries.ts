import { notFound } from "next/navigation";
import { cache } from "react";
import { getCurrentProfile } from "@/features/profile/queries";
import { signMedia } from "@/features/gifts/media";
import { sectionsFromRows, variantFromTheme } from "@/features/gifts/sections";
import { getTemplateStyle } from "@/features/gifts/templates";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/**
 * Admin pages call this first. Non-admins get a 404, not a 403, so the
 * existence of the admin area is not confirmed to them.
 */
export const requireAdmin = cache(async (): Promise<Profile> => {
  const profile = await getCurrentProfile();
  if (profile.role !== "admin") notFound();
  return profile;
});

export type AdminStats = {
  users: number;
  admins: number;
  gifts: number;
  published: number;
  opened_gifts: number;
  responses: number;
  open_reports: number;
  media_count: number;
  media_bytes: number;
  points_in_circulation: number;
  published_last_7_days: number;
  db_bytes: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_stats", {});
  if (error || !data || typeof data !== "object") throw new Error(error?.message ?? "admin_stats failed");
  return data as unknown as AdminStats;
}

export async function listUsers(query: string) {
  const supabase = await createClient();
  let q = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
  if (query.trim()) q = q.ilike("display_name", `%${query.trim().replace(/[%_]/g, "")}%`);
  const { data } = await q;
  return data ?? [];
}

export async function listReports(scope: "open" | "all") {
  const supabase = await createClient();
  let q = supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(100);
  if (scope === "open") q = q.in("status", ["open", "reviewing"]);
  const { data: reports } = await q;
  if (!reports || reports.length === 0) return [];

  const giftIds = [...new Set(reports.map((r) => r.gift_id))];
  const { data: gifts } = await supabase.from("gifts").select("id, title, status, sender_id").in("id", giftIds);
  const giftById = new Map((gifts ?? []).map((g) => [g.id, g]));
  return reports.map((r) => ({ ...r, gift: giftById.get(r.gift_id) ?? null }));
}

export async function listTemplatesAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.from("templates").select("*").order("sort_order");
  return data ?? [];
}

export async function listRecentTransactions() {
  const supabase = await createClient();
  const { data: tx } = await supabase.from("point_transactions").select("*").order("created_at", { ascending: false }).limit(100);
  if (!tx || tx.length === 0) return [];
  const userIds = [...new Set(tx.map((t) => t.user_id))];
  const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
  return tx.map((t) => ({ ...t, userName: nameById.get(t.user_id) ?? t.user_id.slice(0, 8) }));
}

export async function listPayments() {
  const supabase = await createClient();
  const { data } = await supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(100);
  return data ?? [];
}

export async function listAuditLogs() {
  const supabase = await createClient();
  const { data: logs } = await supabase.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
  if (!logs || logs.length === 0) return [];
  const adminIds = [...new Set(logs.map((l) => l.admin_id))];
  const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", adminIds);
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
  return logs.map((l) => ({ ...l, adminName: nameById.get(l.admin_id) ?? l.admin_id.slice(0, 8) }));
}

/** A gift for moderation preview. Admin read is allowed by the owner policies through is_admin(). */
export async function getGiftForModeration(giftId: string) {
  const supabase = await createClient();
  const { data: gift } = await supabase.from("gifts").select("*").eq("id", giftId).maybeSingle();
  if (!gift) return null;
  const [{ data: template }, { data: sections }, { data: recipient }, { data: media }, { data: sender }, { data: reports }] =
    await Promise.all([
      supabase.from("templates").select("slug").eq("id", gift.template_id).single(),
      supabase.from("gift_sections").select("id, type, content, position").eq("gift_id", giftId),
      supabase.from("gift_recipients").select("name").eq("gift_id", giftId).order("created_at").limit(1).maybeSingle(),
      supabase.from("gift_media").select("id, storage_path, thumb_path, width, height").eq("gift_id", giftId),
      supabase.from("profiles").select("display_name").eq("id", gift.sender_id).single(),
      supabase.from("reports").select("*").eq("gift_id", giftId).order("created_at", { ascending: false }),
    ]);
  return {
    gift,
    style: getTemplateStyle(template?.slug ?? ""),
    variant: variantFromTheme(gift.theme),
    sections: sectionsFromRows(sections ?? []),
    media: await signMedia(media ?? []),
    recipientName: recipient?.name ?? "",
    senderName: sender?.display_name ?? "",
    reports: reports ?? [],
  };
}
