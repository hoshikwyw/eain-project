import { cn } from "@/lib/utils";

type Props = { title: string; children: React.ReactNode; className?: string };

/**
 * One group on the settings screen: a small heading and a panel holding its
 * rows, the way a phone's settings app lays things out.
 */
export function SettingsGroup({ title, children, className }: Props) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase my:tracking-normal my:normal-case">{title}</h2>
      <div className={cn("rounded-3xl border border-border bg-card shadow-soft", className)}>{children}</div>
    </section>
  );
}

/** A row inside a group: a label on the left, its control on the right. */
export const settingsRow = "flex min-h-14 items-center justify-between gap-4 px-4 py-2.5 text-sm font-semibold sm:px-5";
