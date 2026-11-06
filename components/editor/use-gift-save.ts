import { startTransition, useActionState, useEffect, useState, useTransition } from "react";
import { saveAndPublishGift, saveGift } from "@/features/gifts/actions";
import type { SaveGiftState } from "@/features/gifts/schemas";

/** A draft saves itself this long after the last change. */
const AUTOSAVE_MS = 3000;

type Options = {
  giftId: string;
  /** Drafts save themselves; a published gift does not, since a save there is live for the receiver at once. */
  autosave: boolean;
  /** The editor's content as the server last saved it, as JSON. Read once. */
  initialJson: () => string;
  /** The editor's content right now, as JSON. */
  payloadJson: string;
  /** Whether the content can be saved as it is. */
  valid: boolean;
  /** Called in place of a save or publish that cannot go ahead, to point at what is missing. */
  onInvalid: () => void;
};

/**
 * Saving and publishing for the editor: what is unsaved, the save action for
 * the Save button's form, saving by itself after a pause, saving from the
 * keyboard, publishing, and the "leave site?" warning while there are
 * unsaved changes.
 */
export function useGiftSave({ giftId, autosave, initialJson, payloadJson, valid, onInvalid }: Options) {
  // What the server last confirmed as saved, to show unsaved changes.
  const [lastSaved, setLastSaved] = useState(initialJson);
  const dirty = payloadJson !== lastSaved;

  /** The content of the last save that failed, so autosave does not keep retrying the same thing. */
  const [failedSave, setFailedSave] = useState<string | null>(null);
  const [state, formAction, saving] = useActionState<SaveGiftState, FormData>(async (prev, fd) => {
    const sent = String(fd.get("payload"));
    const result = await saveGift(giftId, prev, fd);
    if (result.status === "saved") setLastSaved(sent);
    setFailedSave(result.status === "saved" ? null : sent);
    return result;
  }, {});

  // Publish always saves the current editor content first, so nothing typed is lost.
  const [publishing, startPublish] = useTransition();
  const [publishState, setPublishState] = useState<SaveGiftState["status"]>();

  // A draft saves itself once the creator pauses.
  useEffect(() => {
    if (!autosave || !dirty || !valid || saving || publishing || payloadJson === failedSave) return;
    const timer = window.setTimeout(() => {
      const fd = new FormData();
      fd.set("payload", payloadJson);
      startTransition(() => formAction(fd));
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [autosave, dirty, valid, saving, publishing, payloadJson, failedSave, formAction]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const publish = () => {
    if (!valid) return onInvalid();
    startPublish(async () => {
      setPublishState(undefined);
      const fd = new FormData();
      fd.set("payload", payloadJson);
      const result = await saveAndPublishGift(giftId, fd);
      if (result) setPublishState(result.status);
    });
  };

  /** Saves now, for the keyboard. The Save button submits its form to the same action. */
  const saveNow = () => {
    if (!valid) return onInvalid();
    if (saving || publishing) return;
    const fd = new FormData();
    fd.set("payload", payloadJson);
    startTransition(() => formAction(fd));
  };

  return { dirty, state, formAction, saving, publishing, publishState, publish, saveNow };
}
