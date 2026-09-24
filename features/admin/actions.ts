"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * Every admin action is a database function that checks the admin role and
 * writes an audit row itself. These wrappers only validate input and route.
 */

function back(path: string, key: string, value: string): never {
  const url = new URL(path, "http://x");
  url.searchParams.set(key, value);
  redirect(`${url.pathname}${url.search}`);
}

export async function setUserRole(formData: FormData): Promise<void> {
  const parsed = z.object({ userId: z.uuid(), role: z.enum(["user", "admin"]) }).safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) back("/admin/users", "error", "invalid");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_role", { p_user_id: parsed.data.userId, p_role: parsed.data.role });
  revalidatePath("/admin", "layout");
  if (error) back("/admin/users", "error", error.message.includes("own role") ? "ownRole" : "failed");
  back("/admin/users", "ok", "role");
}

export async function adjustPoints(formData: FormData): Promise<void> {
  const parsed = z
    .object({
      userId: z.uuid(),
      amount: z.coerce.number().int().refine((n) => n !== 0 && Math.abs(n) <= 100000),
      description: z.string().trim().max(200).default(""),
    })
    .safeParse({ userId: formData.get("userId"), amount: formData.get("amount"), description: formData.get("description") ?? "" });
  if (!parsed.success) back("/admin/users", "error", "invalid");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_adjust_points", {
    p_user_id: parsed.data.userId,
    p_amount: parsed.data.amount,
    p_description: parsed.data.description,
  });
  revalidatePath("/admin", "layout");
  if (error) back("/admin/users", "error", error.message.includes("insufficient") ? "insufficient" : "failed");
  back("/admin/users", "ok", "points");
}

export async function updateTemplate(formData: FormData): Promise<void> {
  const parsed = z
    .object({
      templateId: z.uuid(),
      isActive: z.boolean(),
      isFeatured: z.boolean(),
      isPremium: z.boolean(),
      pointPrice: z.coerce.number().int().min(0).max(100000),
    })
    .safeParse({
      templateId: formData.get("templateId"),
      isActive: formData.get("isActive") === "on",
      isFeatured: formData.get("isFeatured") === "on",
      isPremium: formData.get("isPremium") === "on",
      pointPrice: formData.get("pointPrice") ?? 0,
    });
  if (!parsed.success) back("/admin/templates", "error", "invalid");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_template", {
    p_template_id: parsed.data.templateId,
    p_is_active: parsed.data.isActive,
    p_is_featured: parsed.data.isFeatured,
    p_is_premium: parsed.data.isPremium,
    p_point_price: parsed.data.pointPrice,
  });
  revalidatePath("/", "layout");
  if (error) back("/admin/templates", "error", "failed");
  back("/admin/templates", "ok", "template");
}

export async function resolveReport(formData: FormData): Promise<void> {
  const parsed = z.object({ reportId: z.uuid(), status: z.enum(["reviewing", "resolved", "dismissed"]) }).safeParse({
    reportId: formData.get("reportId"),
    status: formData.get("status"),
  });
  if (!parsed.success) back("/admin/reports", "error", "invalid");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_resolve_report", { p_report_id: parsed.data.reportId, p_status: parsed.data.status });
  revalidatePath("/admin", "layout");
  if (error) back("/admin/reports", "error", "failed");
  back("/admin/reports", "ok", "report");
}

export async function disableGift(formData: FormData): Promise<void> {
  const parsed = z.object({ giftId: z.uuid(), reason: z.string().trim().max(300).default("") }).safeParse({
    giftId: formData.get("giftId"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) back("/admin/reports", "error", "invalid");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_disable_gift", { p_gift_id: parsed.data.giftId, p_reason: parsed.data.reason });
  revalidatePath("/admin", "layout");
  if (error) back(`/admin/gifts/${parsed.data.giftId}`, "error", "failed");
  back(`/admin/gifts/${parsed.data.giftId}`, "ok", "disabled");
}
