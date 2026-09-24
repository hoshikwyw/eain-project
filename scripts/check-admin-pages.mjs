// Creates a temporary admin, fetches every admin page with its session cookie, deletes the admin.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const site = "http://localhost:5173";
const ref = new URL(url).hostname.split(".")[0];

const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const client = createClient(url, anonKey, { auth: { persistSession: false } });

const email = `admin-check-${Date.now()}@example.com`;
const password = `Check-${Math.random().toString(36).slice(2)}-pass`;
const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: "Admin check" } });
if (error) throw error;
const id = data.user.id;
try {
  await service.from("profiles").update({ role: "admin" }).eq("id", id);
  const { data: s } = await client.auth.signInWithPassword({ email, password });
  const value = "base64-" + Buffer.from(JSON.stringify(s.session)).toString("base64url");
  const name = `sb-${ref}-auth-token`;
  const cookie = value.length <= 3180 ? `${name}=${value}` : Array.from({ length: Math.ceil(value.length / 3180) }, (_, i) => `${name}.${i}=${value.slice(i * 3180, (i + 1) * 3180)}`).join("; ");

  for (const path of ["/admin", "/admin/users", "/admin/templates", "/admin/reports", "/admin/reports?scope=all", "/admin/points", "/admin/payments", "/admin/audit", "/dashboard"]) {
    const res = await fetch(`${site}${path}`, { headers: { cookie }, redirect: "manual" });
    const html = await res.text();
    const marker = path === "/dashboard" ? html.includes('href="/admin"') : html.includes("Admin</span>") || html.includes('aria-label="Admin"');
    console.log(`${path} -> ${res.status} ${marker ? "(admin chrome present)" : ""}`);
  }
} finally {
  await service.auth.admin.deleteUser(id);
  console.log("temporary admin removed");
}
