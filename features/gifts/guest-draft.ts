/**
 * The rules for the gift a visitor keeps in their browser before signing up.
 * No imports on purpose: the tests load this file directly in Node.
 */

/** Where the draft lives in localStorage. One draft at a time. */
export const GUEST_DRAFT_KEY = "eain_guest_draft";

/** A draft older than this is forgotten: the moment has passed, and the templates may have changed. */
export const GUEST_DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** True when a draft saved at `savedAt` (ISO date) is still worth keeping at `now`. */
export function isFreshDraft(savedAt: string, now = Date.now()): boolean {
  const saved = Date.parse(savedAt);
  if (Number.isNaN(saved)) return false;
  return now - saved <= GUEST_DRAFT_MAX_AGE_MS;
}
