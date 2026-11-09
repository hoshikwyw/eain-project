import { useEffect, useState } from "react";
import { editorPayloadSchema, type EditorPayload } from "@/features/gifts/schemas";

/** Where a visitor's unsaved gift lives in their browser. One draft at a time. */
export const GUEST_DRAFT_KEY = "eain_guest_draft";
/** A draft is written this long after the last change. */
const WRITE_MS = 800;

export type GuestDraft = { template: string; savedAt: string; payload: EditorPayload };

/** The draft kept in this browser, if there is one and it is still readable. Browser only. */
export function readGuestDraft(): GuestDraft | null {
  try {
    const raw = window.localStorage.getItem(GUEST_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GuestDraft>;
    const payload = editorPayloadSchema.safeParse(parsed.payload);
    if (typeof parsed.template !== "string" || !payload.success) return null;
    return {
      template: parsed.template,
      savedAt: String(parsed.savedAt ?? ""),
      payload: payload.data,
    };
  } catch {
    return null;
  }
}

export function clearGuestDraft() {
  try {
    window.localStorage.removeItem(GUEST_DRAFT_KEY);
  } catch {
    // Storage blocked: nothing was kept, so there is nothing to clear.
  }
}

/**
 * Keeps a visitor's gift in their browser while they try a template without
 * an account: every change is written shortly after it is made. Pass null
 * when the editor is working on a real gift; nothing happens then. Putting an
 * earlier draft back is the GuestEditor's job, before the editor first draws.
 */
export function useGuestDraft(options: { template: string; payloadJson: string } | null) {
  const [saved, setSaved] = useState(false);
  const template = options?.template;
  const payloadJson = options?.payloadJson;

  useEffect(() => {
    if (!template || payloadJson === undefined) return;
    const timer = window.setTimeout(() => {
      try {
        const draft: GuestDraft = {
          template,
          savedAt: new Date().toISOString(),
          payload: JSON.parse(payloadJson),
        };
        window.localStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify(draft));
        setSaved(true);
      } catch {
        // Storage full or blocked: the editor still works, only without a copy on the device.
        setSaved(false);
      }
    }, WRITE_MS);
    return () => window.clearTimeout(timer);
  }, [template, payloadJson]);

  return { saved };
}
