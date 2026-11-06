"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Props = React.ComponentProps<typeof Button> & {
  confirmText: string;
  /** What the popup's confirm button says. Default: the same as this button. */
  confirmLabel?: React.ReactNode;
  /** The action cannot be undone: the popup's confirm button turns red. */
  danger?: boolean;
};

/**
 * Button for a form whose action is hard to undo. It does not submit; it
 * opens a popup that asks first, and the popup's confirm button submits the
 * form. Must sit inside the form.
 */
export function ConfirmButton({
  confirmText,
  confirmLabel,
  danger,
  onClick,
  children,
  disabled,
  ...props
}: Props) {
  const { pending } = useFormStatus();
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);

  // The popup stays up while the action runs and closes once it has finished.
  const [wasPending, setWasPending] = useState(false);
  if (pending !== wasPending) {
    setWasPending(pending);
    if (!pending) setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        aria-busy={pending}
        disabled={pending || disabled}
        {...props}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          // Ask only about a form that is ready to send; otherwise show what is missing.
          if (e.currentTarget.form && !e.currentTarget.form.reportValidity()) return;
          setOpen(true);
        }}
      >
        {pending && <Loader2 className="animate-spin" />}
        {children}
      </Button>
      <ConfirmDialog
        open={open}
        text={confirmText}
        confirmLabel={confirmLabel ?? children}
        cancelLabel={t("cancel")}
        danger={danger}
        pending={pending}
        submit
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
