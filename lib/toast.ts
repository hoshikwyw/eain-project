/**
 * Toasts: short confirmations that something happened, shown from client
 * code only (never from a server action; pass the action's promise to
 * `toast.promise` instead). House rules:
 *
 * - Say what happened, in the reader's words from messages/*.json: "Link
 *   copied", "Gift published", not "Success".
 * - Form validation stays inline next to the field. A toast is for the
 *   outcome of an action, or an error the person did not cause.
 * - Errors stay until dismissed on their own; everything else goes after a
 *   few seconds. Give an error a next step when there is one (`action`).
 * - Quiet, automatic work (autosave, analytics) does not toast.
 *
 * The viewport is mounted once by components/ui/app-toaster.tsx.
 */
export { toast } from "@yusufceng1z/ding-react";
