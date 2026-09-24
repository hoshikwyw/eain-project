"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "./button";

type Props = React.ComponentProps<typeof Button> & {
  /** Text shown while the action runs. Defaults to the children with a spinner. */
  pendingLabel?: React.ReactNode;
};

/**
 * Submit button for forms that call a Server Action. Disables itself and
 * shows a spinner while the action is pending, so double taps and "did it
 * work?" moments go away. Must be rendered inside the form.
 */
export function SubmitButton({ pendingLabel, children, disabled, ...props }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" aria-busy={pending} disabled={pending || disabled} {...props}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
