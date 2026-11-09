import { startTransition, useActionState, useEffect, useRef, useState, useTransition } from "react";
import { refreshGiftPages, saveAndPublishGift, saveGift } from "@/features/gifts/actions";
import type { SaveGiftState } from "@/features/gifts/schemas";

/** A draft saves itself this long after the last change. */
const AUTOSAVE_MS = 3000;

type Options = {
  giftId: string;
  /** False while a visitor tries a template: nothing is saved to the server and leaving is free. */
  enabled?: boolean;
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
export function useGiftSave({
  giftId,
  enabled = true,
  autosave,
  initialJson,
  payloadJson,
  valid,
  onInvalid,
}: Options) {
  // What the server last confirmed as saved, to show unsaved changes.
  const [lastSaved, setLastSaved] = useState(initialJson);
  const dirty = payloadJson !== lastSaved;

  // Saving does not redraw any page (see saveGift). So when the creator leaves after a save,
  // the pages that show this gift are told to read it again.
  const savedHere = useRef(false);
  useEffect(
    () => () => {
      if (savedHere.current) void refreshGiftPages(giftId).catch(() => undefined);
    },
    [giftId],
  );

  /** Publish was pressed while a save was still running. It goes ahead as soon as that save ends. */
  const [publishQueued, setPublishQueued] = useState(false);
  const publishWaiting = useRef(false);
  const latest = useRef({ publishNow: () => {} });

  /** The content of the last save that failed, so autosave does not keep retrying the same thing. */
  const [failedSave, setFailedSave] = useState<string | null>(null);
  const [state, formAction, saving] = useActionState<SaveGiftState, FormData>(async (prev, fd) => {
    const sent = String(fd.get("payload"));
    const result = await saveGift(giftId, prev, fd);
    if (result.status === "saved") {
      setLastSaved(sent);
      savedHere.current = true;
    }
    setFailedSave(result.status === "saved" ? null : sent);
    // Publish was pressed while this save was running: it goes ahead now, with what is in the editor now.
    if (publishWaiting.current) {
      publishWaiting.current = false;
      setPublishQueued(false);
      latest.current.publishNow();
    }
    return result;
  }, {});

  // Publish always saves the current editor content first, so nothing typed is lost.
  const [publishing, startPublish] = useTransition();
  const [publishState, setPublishState] = useState<SaveGiftState["status"]>();

  // A draft saves itself once the creator pauses.
  useEffect(() => {
    if (
      !enabled ||
      !autosave ||
      !dirty ||
      !valid ||
      saving ||
      publishing ||
      payloadJson === failedSave
    )
      return;
    const timer = window.setTimeout(() => {
      const fd = new FormData();
      fd.set("payload", payloadJson);
      startTransition(() => formAction(fd));
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, autosave, dirty, valid, saving, publishing, payloadJson, failedSave, formAction]);

  useEffect(() => {
    if (!enabled || !dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [enabled, dirty]);

  const runPublish = () =>
    startPublish(async () => {
      setPublishState(undefined);
      const fd = new FormData();
      fd.set("payload", payloadJson);
      const result = await saveAndPublishGift(giftId, fd);
      if (result) setPublishState(result.status);
    });
  const publish = () => {
    if (!valid) return onInvalid();
    // A save is running: wait for it, so the two never write at the same time.
    if (saving) {
      publishWaiting.current = true;
      return setPublishQueued(true);
    }
    runPublish();
  };
  // The save that is running when Publish is pressed needs the editor's content as it is when the save ends.
  useEffect(() => {
    latest.current = { publishNow: () => (valid ? runPublish() : onInvalid()) };
  });

  /** Saves now, for the keyboard. The Save button submits its form to the same action. */
  const saveNow = () => {
    if (!valid) return onInvalid();
    if (saving || publishing) return;
    const fd = new FormData();
    fd.set("payload", payloadJson);
    startTransition(() => formAction(fd));
  };

  return {
    dirty,
    state,
    formAction,
    saving,
    publishing: publishing || publishQueued,
    publishState,
    publish,
    saveNow,
  };
}
