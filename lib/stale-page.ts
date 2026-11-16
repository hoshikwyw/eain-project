/**
 * A page from an earlier deploy can stay open in a tab for days. When it then
 * calls a server action, the new deploy no longer knows that action's id and
 * Next throws "Server Action … was not found" (its UnrecognizedActionError).
 * The only cure is a fresh copy of the page, so we reload it once. Vercel's
 * own answer to this, Skew Protection, is not on the Hobby plan.
 *
 * Pure helpers here; the browser wiring is in components/layout/stale-page-recovery.tsx
 * and app/error.tsx.
 */

/** Session storage key holding the time of the last such reload. */
export const STALE_RELOAD_KEY = "eain_stale_reload";
/** Reload at most once in this window, so a real bug cannot loop forever. */
export const STALE_RELOAD_WINDOW_MS = 60_000;

/** Whether an error means the page's server actions are from an older deploy. */
export function isStaleActionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { name, message, digest } = error as {
    name?: unknown;
    message?: unknown;
    digest?: unknown;
  };
  if (name === "UnrecognizedActionError") return true;
  const text = [message, digest].filter((v): v is string => typeof v === "string").join(" ");
  return (
    text.includes("failed-to-find-server-action") || /Server Action .* was not found/i.test(text)
  );
}

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

/** True when no stale reload happened within the window. Reads only. */
export function staleReloadAllowed(storage: StorageLike, now = Date.now()): boolean {
  const last = Number(storage.getItem(STALE_RELOAD_KEY) ?? 0);
  return !(last > 0 && now - last < STALE_RELOAD_WINDOW_MS);
}

/** Like staleReloadAllowed, and records the reload when it says yes. */
export function claimStaleReload(storage: StorageLike, now = Date.now()): boolean {
  if (!staleReloadAllowed(storage, now)) return false;
  storage.setItem(STALE_RELOAD_KEY, String(now));
  return true;
}

/** Session storage, or null where the browser refuses it (some private modes). */
export function sessionStorageOrNull(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Reloads the page once for a stale-deploy error. Says whether it did. */
export function reloadIfStale(error: unknown): boolean {
  if (!isStaleActionError(error)) return false;
  const storage = sessionStorageOrNull();
  if (!storage || !claimStaleReload(storage)) return false;
  window.location.reload();
  return true;
}
