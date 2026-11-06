"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * A template card that starts a gift when pressed. It is a form button and
 * not a link, because starting a gift changes data and a link can be
 * followed by the browser before anyone presses it. Must sit inside the
 * form. Shows a spinner over the card while the gift is being made.
 */
export function StartTemplateButton({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn("relative cursor-pointer text-left disabled:cursor-progress", className)}
      {...props}
    >
      {children}
      {pending && (
        <span className="absolute inset-0 grid place-items-center rounded-2xl bg-background/60 backdrop-blur-[2px]">
          <Loader2 className="size-6 animate-spin" />
        </span>
      )}
    </button>
  );
}
