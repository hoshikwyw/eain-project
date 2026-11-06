"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  /** What is being previewed, for screen readers. */
  label: string;
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
};

/**
 * A preview over the whole editor: the page dims and blurs behind it. A
 * press on the dimmed page, or on the corner button, closes it. Content that
 * should not close it on a press stops the press itself.
 */
export function PreviewOverlay({ label, closeLabel, onClose, children }: Props) {
  return (
    <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4 backdrop-blur-md" onClick={onClose}>
      <Button type="button" variant="ghost" size="icon" className="absolute top-4 right-4" aria-label={closeLabel} onClick={onClose}>
        <X />
      </Button>
      {children}
    </div>
  );
}
