"use client";

import { Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteResponse } from "@/features/gifts/actions";
import type { ResponseView } from "@/features/gifts/queries";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type Filter = "all" | "yes" | "no";

type Props = {
  giftId: string;
  responses: ResponseView[];
  labels: {
    all: string;
    coming: string;
    notComing: string;
    guest: string;
    remove: string;
    removeConfirm: string;
    removed: string;
    removeFailed: string;
    cancel: string;
  };
};

/**
 * The replies to a gift as a list a host can read down: one row per guest
 * with their name, their yes or no as a coloured chip, the rest of their
 * answers, and when they replied. With an RSVP question the list can be
 * narrowed to those coming or not. A reply can be removed; the guest may
 * then answer again.
 */
export function GuestList({ giftId, responses, labels }: Props) {
  const format = useFormatter();
  const t = useTranslations("dashboard.gifts.responses");
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [target, setTarget] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const rsvpOf = (r: ResponseView) => r.answers.find((a) => a.pick !== null) ?? null;
  const hasRsvp = responses.some((r) => rsvpOf(r));
  const counts: Record<Filter, number> = {
    all: responses.length,
    yes: responses.filter((r) => rsvpOf(r)?.pick === "yes").length,
    no: responses.filter((r) => rsvpOf(r)?.pick === "no").length,
  };
  const shown = filter === "all" ? responses : responses.filter((r) => rsvpOf(r)?.pick === filter);
  // Guests to expect: the headcounts of everyone who did not say no.
  const headcounts = responses
    .filter((r) => rsvpOf(r)?.pick !== "no")
    .map((r) => r.answers.find((a) => a.kind === "count")?.number ?? null);
  const expected = headcounts.some((n) => n !== null)
    ? headcounts.reduce<number>((sum, n) => sum + (n ?? 0), 0)
    : null;

  function remove() {
    const id = target;
    if (!id) return;
    start(async () => {
      const ok = await deleteResponse(giftId, id).catch(() => false);
      if (ok) {
        toast.success(labels.removed, { duration: 2500 });
        // The list is server-rendered: fetch it again without the reply.
        router.refresh();
      } else toast.error(labels.removeFailed);
      setTarget(null);
    });
  }

  const chips: { key: Filter; label: string }[] = [
    { key: "all", label: labels.all },
    { key: "yes", label: labels.coming },
    { key: "no", label: labels.notComing },
  ];

  return (
    <div className="mt-4 flex flex-col gap-3">
      {expected !== null && (
        <p className="rounded-2xl border border-border px-4 py-3 text-sm">
          {t("expected", { count: expected })}
        </p>
      )}
      {hasRsvp && (
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-pressed={filter === c.key}
              onClick={() => setFilter(c.key)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
                filter === c.key
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {c.label} {format.number(counts[c.key], "digits")}
            </button>
          ))}
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {shown.map((r) => {
          const rsvp = rsvpOf(r);
          const named = r.answers.find((a) => a.kind === "short_text" && a.value.trim());
          const title = named?.value ?? (rsvp ? labels.guest : null);
          const rest = r.answers.filter((a) => a !== rsvp && a !== named);
          return (
            <li key={r.id} className="flex items-start gap-3 rounded-2xl bg-secondary/60 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  {title && <p className="font-semibold break-words">{title}</p>}
                  {rsvp && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        rsvp.pick === "yes"
                          ? "bg-success/15 text-success"
                          : "bg-destructive/10 text-destructive",
                      )}
                    >
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                      {rsvp.value}
                    </span>
                  )}
                </div>
                {rest.length > 0 && (
                  <dl className={cn("flex flex-col gap-1", title && "mt-1.5")}>
                    {rest.map((a, i) => (
                      <div key={i} className="text-sm">
                        <dt className="inline text-muted-foreground">{a.prompt}: </dt>
                        <dd className="inline break-words whitespace-pre-line">{a.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {format.dateTime(new Date(r.createdAt), {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label={labels.remove}
                title={labels.remove}
                className="shrink-0"
                onClick={() => setTarget(r.id)}
              >
                <Trash2 />
              </Button>
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={target !== null}
        text={labels.removeConfirm}
        confirmLabel={labels.remove}
        cancelLabel={labels.cancel}
        danger
        pending={pending}
        onConfirm={remove}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
