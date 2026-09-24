"use client";

import { Loader2 } from "lucide-react";
import { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";

/**
 * Spinner that appears while the page behind a Link is loading.
 * Must be rendered as a child of that Link.
 */
export function LinkPending({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <Loader2 aria-label="Loading" className={cn("size-4 animate-spin text-muted-foreground", className)} />;
}
