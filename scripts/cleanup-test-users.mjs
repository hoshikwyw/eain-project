/**
 * Removes throwaway accounts the test suites create (emails ending in
 * @example.com), including their photos in storage. Use it after a test run
 * was interrupted. Real accounts are never touched.
 *
 * Usage: pnpm cleanup:test-users            (lists what would be removed)
 *        pnpm cleanup:test-users --yes      (removes them)
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");

const apply = process.argv.includes("--yes");
const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (error) throw error;

const targets = data.users.filter((u) => (u.email ?? "").toLowerCase().endsWith("@example.com"));
// No process.exit(): on Windows it can abort while network handles are closing.
if (targets.length === 0) console.log("No test accounts found.");

for (const u of targets) {
  if (!apply) {
    console.log(`would remove ${u.email}`);
    continue;
  }
  const { data: media } = await admin.from("gift_media").select("storage_path, thumb_path").eq("owner_id", u.id);
  const paths = (media ?? []).flatMap((m) => [m.storage_path, m.thumb_path].filter(Boolean));
  if (paths.length) await admin.storage.from("gift-media").remove(paths);
  const { error: delError } = await admin.auth.admin.deleteUser(u.id);
  console.log(delError ? `failed ${u.email}: ${delError.message}` : `removed ${u.email} (${paths.length} files)`);
}
if (!apply && targets.length > 0) console.log(`\n${targets.length} test accounts. Run again with --yes to remove them.`);
