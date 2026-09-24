"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type Props = React.ComponentProps<typeof Button> & { confirmText: string };

/** Submit button that asks before an action that is hard to undo, then shows progress. */
export function ConfirmButton({ confirmText, onClick, children, disabled, ...props }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      aria-busy={pending}
      disabled={pending || disabled}
      {...props}
      onClick={(e) => {
        if (!window.confirm(confirmText)) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    >
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}
