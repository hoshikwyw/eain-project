import { cn } from "@/lib/utils";
import { CapsLabel } from "@/components/ui/caps-label";

type Props = { title: string; children: React.ReactNode; className?: string };

/**
 * One group on the settings screen: a small heading and a panel holding its
 * rows, the way a phone's settings app lays things out.
 */
export function SettingsGroup({ title, children, className }: Props) {
  return (
    <section className="flex flex-col gap-2">
      <CapsLabel as="h2" className="px-1">{title}</CapsLabel>
      <div className={cn("panel", className)}>{children}</div>
    </section>
  );
}

/** A row inside a group: a label on the left, its control on the right. */
export const settingsRow = "flex min-h-14 items-center justify-between gap-4 px-4 py-2.5 text-sm font-semibold sm:px-5";
