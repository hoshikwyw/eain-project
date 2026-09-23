"use client";

import { Button } from "@/components/ui/button";

type Props = React.ComponentProps<typeof Button> & { confirmText: string };

/** Submit button that asks before an action that is hard to undo. */
export function ConfirmButton({ confirmText, onClick, ...props }: Props) {
  return (
    <Button
      type="submit"
      {...props}
      onClick={(e) => {
        if (!window.confirm(confirmText)) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    />
  );
}
