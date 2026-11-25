import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/database";

/**
 * Account data for the admin area. Emails and sign-in details live in
 * Supabase Auth, which only the service role can read, so these helpers run
 * on the server after requireAdmin() has passed on the page.
 */

export type AdminUserRow = {
  id: string;
  email: string;
  provider: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  points: number;
  locale: string;
  gifts: number;
  createdAt: string;
  lastSignInAt: string | null;
  suspended: boolean;
  emailConfirmed: boolean;
};

function isSuspended(bannedUntil: string | null | undefined): boolean {
  return Boolean(bannedUntil && new Date(bannedUntil).getTime() > Date.now());
}

export async function listUsersAdmin(query: string): Promise<AdminUserRow[]> {
  const admin = createAdminClient();
  const [{ data: authData }, { data: profiles }, { data: gifts }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("profiles").select("id, display_name, avatar_url, role, points_balance, locale"),
    admin.from("gifts").select("sender_id").neq("status", "deleted"),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const giftCount = new Map<string, number>();
  for (const g of gifts ?? []) giftCount.set(g.sender_id, (giftCount.get(g.sender_id) ?? 0) + 1);

  const q = query.trim().toLowerCase();
  return (authData?.users ?? [])
    .map((u) => {
      const p = profileById.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "",
        provider: (u.app_metadata?.provider as string | undefined) ?? "email",
        displayName: p?.display_name ?? "",
        avatarUrl: p?.avatar_url ?? null,
        role: (p?.role ?? "user") as UserRole,
        points: p?.points_balance ?? 0,
        locale: p?.locale ?? "en",
        gifts: giftCount.get(u.id) ?? 0,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        suspended: isSuspended((u as { banned_until?: string | null }).banned_until),
        emailConfirmed: Boolean(u.email_confirmed_at),
      };
    })
    .filter(
      (u) => !q || u.email.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getUserAdmin(userId: string) {
  const admin = createAdminClient();
  const { data: authData, error } = await admin.auth.admin.getUserById(userId);
  if (error || !authData?.user) return null;
  const u = authData.user;

  const [
    { data: profile },
    { data: gifts },
    { data: transactions },
    { data: templates },
    { data: audit },
    { data: unlocks },
  ] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).maybeSingle(),
    admin
      .from("gifts")
      .select("id, title, status, template_id, created_at, published_at")
      .eq("sender_id", userId)
      .order("created_at", { ascending: false }),
    admin
      .from("point_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("templates").select("id, name_en, is_premium, paid_only, is_active, sort_order"),
    admin
      .from("admin_audit_logs")
      .select("*")
      .eq("target_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("template_unlocks")
      .select("template_id, transaction_id, created_at")
      .eq("user_id", userId),
  ]);

  const giftIds = (gifts ?? []).map((g) => g.id);
  const [{ data: reports }, { data: recipients }, { data: media }] = await Promise.all([
    giftIds.length
      ? admin
          .from("reports")
          .select("*")
          .in("gift_id", giftIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    giftIds.length
      ? admin.from("gift_recipients").select("gift_id, first_opened_at").in("gift_id", giftIds)
      : Promise.resolve({ data: [] }),
    admin.from("gift_media").select("bytes").eq("owner_id", userId),
  ]);

  const templateName = new Map((templates ?? []).map((t) => [t.id, t.name_en]));
  const openedGift = new Set(
    (recipients ?? []).filter((r) => r.first_opened_at).map((r) => r.gift_id),
  );

  return {
    id: u.id,
    email: u.email ?? "",
    provider: (u.app_metadata?.provider as string | undefined) ?? "email",
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at ?? null,
    emailConfirmed: Boolean(u.email_confirmed_at),
    suspended: isSuspended((u as { banned_until?: string | null }).banned_until),
    bannedUntil: (u as { banned_until?: string | null }).banned_until ?? null,
    profile,
    gifts: (gifts ?? []).map((g) => ({
      ...g,
      templateName: templateName.get(g.template_id) ?? "",
      opened: openedGift.has(g.id),
    })),
    transactions: transactions ?? [],
    reports: reports ?? [],
    audit: audit ?? [],
    /** Premium templates they own; paid ones have no transaction behind them. */
    unlocks: (unlocks ?? []).map((x) => ({
      templateId: x.template_id,
      name: templateName.get(x.template_id) ?? "",
      paid: x.transaction_id === null,
      createdAt: x.created_at,
    })),
    /** Premium templates they could still be given, paid-only ones first. */
    grantable: (templates ?? [])
      .filter(
        (x) => x.is_premium && x.is_active && !(unlocks ?? []).some((o) => o.template_id === x.id),
      )
      .sort((a, b) => Number(b.paid_only) - Number(a.paid_only) || a.sort_order - b.sort_order)
      .map((x) => ({ id: x.id, name: x.name_en, paidOnly: x.paid_only })),
    storageBytes: (media ?? []).reduce((sum, m) => sum + (m.bytes ?? 0), 0),
  };
}
