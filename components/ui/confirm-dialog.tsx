"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  /** The question being asked. */
  text: string;
  confirmLabel: React.ReactNode;
  cancelLabel: string;
  /** The action cannot be undone: the confirm button turns red. */
  danger?: boolean;
  /** The action is running: both buttons wait and the popup stays. */
  pending?: boolean;
  /** Makes the confirm button submit the form the popup sits in. */
  submit?: boolean;
  onConfirm?: () => void;
  onCancel: () => void;
};

/**
 * A question in a popup, with Cancel and a confirm button. It is the
 * browser's own modal dialog, so it sits above everything, keeps focus
 * inside and closes on Escape. Focus starts on Cancel, the safe answer.
 */
export function ConfirmDialog({ open, text, confirmLabel, cancelLabel, danger, pending, submit, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const textId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={textId}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] glass-strong rounded-3xl border p-0 text-left text-foreground shadow-2xl backdrop:bg-scrim backdrop:backdrop-blur-md"
      // Escape asks to close; while the action runs the popup stays.
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onCancel();
      }}
      // A press on the dimmed page around the popup cancels.
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) onCancel();
      }}
    >
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-start gap-3">
          {danger && (
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-destructive/15 text-destructive">
              <TriangleAlert className="size-5" />
            </span>
          )}
          <p id={textId} className={cn("text-base leading-relaxed font-medium text-pretty", danger && "pt-1.5")}>
            {text}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" disabled={pending} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type={submit ? "submit" : "button"}
            disabled={pending}
            aria-busy={pending}
            onClick={onConfirm}
            className={cn(danger && "bg-destructive text-white dark:text-black/90")}
          >
            {pending && <Loader2 className="animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
