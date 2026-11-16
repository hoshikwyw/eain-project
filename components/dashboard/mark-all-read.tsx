"use client";

import { CheckCheck } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markAllNotificationsRead } from "@/features/notifications/actions";
import { toast } from "@/lib/toast";

/** Marks every notification read and says so. The list refreshes on its own. */
export function MarkAllRead({ label, done }: { label: string; done: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={pending}
      aria-busy={pending}
      onClick={() =>
        start(async () => {
          await markAllNotificationsRead();
          toast.success(done, { duration: 2500 });
        })
      }
    >
      <CheckCheck />
      {label}
    </Button>
  );
}
