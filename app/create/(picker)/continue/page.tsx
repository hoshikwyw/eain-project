import { ContinueDraft } from "@/components/editor/continue-draft";

/**
 * Where a visitor lands after signing up from the guest editor: the gift
 * they made in the browser becomes their first saved gift. Signed-out
 * visitors are sent to log in first, by proxy.ts, and come back here.
 */
export default function ContinueDraftPage() {
  return <ContinueDraft />;
}
