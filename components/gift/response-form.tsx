"use client";

import { Check, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { PublicQuestion } from "@/features/gifts/schemas";
import { cn } from "@/lib/utils";

type Answer = { optionId?: string; text?: string; number?: number };

type Props = {
  token: string;
  questions: PublicQuestion[];
  sessionId: () => string;
  onStarted: () => void;
};

const textareaClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

/** The receiver's reply. No account, one submission per browser session. */
export function ResponseForm({ token, questions, sessionId, onStarted }: Props) {
  const t = useTranslations("gift.response");
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const doneKey = `eain_responded_${token}`;
  // This form mounts only after the receiver taps "open", so it never renders
  // on the server and reading localStorage in the initialiser is safe.
  const [state, setState] = useState<"idle" | "sending" | "sent" | "duplicate" | "error" | "invalid">(() => {
    try {
      return window.localStorage.getItem(doneKey) ? "sent" : "idle";
    } catch {
      return "idle";
    }
  });
  const started = useRef(false);

  function set(questionId: string, answer: Answer) {
    if (!started.current) {
      started.current = true;
      onStarted();
    }
    setAnswers((a) => ({ ...a, [questionId]: answer }));
  }

  const missingRequired = questions.some((q) => q.required && !isAnswered(q, answers[q.id]));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (missingRequired) {
      setState("invalid");
      return;
    }
    const payload = questions
      .filter((q) => isAnswered(q, answers[q.id]))
      .map((q) => ({
        questionId: q.id,
        optionId: answers[q.id]?.optionId ?? null,
        text: answers[q.id]?.text?.trim() || null,
        number: answers[q.id]?.number ?? null,
      }));
    if (payload.length === 0) {
      setState("invalid");
      return;
    }
    setState("sending");
    try {
      const res = await fetch(`/api/g/${token}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId(), answers: payload }),
      });
      if (res.ok || res.status === 409) {
        try {
          window.localStorage.setItem(doneKey, "1");
        } catch {
          // ignore
        }
        setState(res.ok ? "sent" : "duplicate");
      } else if (res.status === 400) {
        setState("invalid");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  if (questions.length === 0) return null;

  if (state === "sent" || state === "duplicate") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-success-soft text-success">
          <Check className="size-6" />
        </span>
        <p className="font-display text-xl font-semibold">{t("sentTitle")}</p>
        <p className="text-sm text-muted-foreground">{state === "sent" ? t("sentText") : t("alreadyText")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div>
        <h2 className="font-display text-2xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {questions.map((q, index) => (
        <fieldset key={q.id} className="flex flex-col gap-3">
          <legend className="font-semibold">
            {q.prompt}
            {q.required && <span className="ml-1 text-primary">*</span>}
          </legend>
          <QuestionInput question={q} index={index} value={answers[q.id]} onChange={(a) => set(q.id, a)} />
        </fieldset>
      ))}

      {state === "invalid" && (
        <p role="alert" className="text-sm text-destructive">
          {t("invalid")}
        </p>
      )}
      {state === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {t("error")}
        </p>
      )}

      <Button type="submit" size="lg" disabled={state === "sending"} className="self-start">
        <Send />
        {state === "sending" ? t("sending") : t("send")}
      </Button>
      <p className="text-xs text-muted-foreground">{t("privacy")}</p>
    </form>
  );
}

function isAnswered(q: PublicQuestion, a: Answer | undefined): boolean {
  if (!a) return false;
  if (q.kind === "short_text") return Boolean(a.text && a.text.trim());
  if (q.kind === "rating") return typeof a.number === "number";
  return Boolean(a.optionId);
}

function QuestionInput({
  question: q,
  index,
  value,
  onChange,
}: {
  question: PublicQuestion;
  index: number;
  value: Answer | undefined;
  onChange: (a: Answer) => void;
}) {
  const t = useTranslations("gift.response");

  switch (q.kind) {
    case "short_text":
      return (
        <textarea
          aria-label={q.prompt}
          value={value?.text ?? ""}
          onChange={(e) => onChange({ text: e.target.value })}
          maxLength={1000}
          rows={3}
          placeholder={t("textPlaceholder")}
          className={textareaClass}
        />
      );
    case "rating":
      return (
        <div className="flex gap-2" role="radiogroup" aria-label={q.prompt}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value?.number === n}
              aria-label={String(n)}
              onClick={() => onChange({ number: n })}
              className={cn(
                "size-11 rounded-full border text-lg font-semibold transition-colors",
                value?.number === n ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      );
    case "reaction":
      return (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={q.prompt}>
          {q.options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={value?.optionId === o.id}
              aria-label={o.label}
              onClick={() => onChange({ optionId: o.id })}
              className={cn(
                "grid size-12 place-items-center rounded-full border text-2xl transition-transform",
                value?.optionId === o.id ? "scale-110 border-primary bg-accent" : "border-border hover:bg-secondary",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      );
    case "choice":
    case "yes_no":
    default:
      return (
        <div className="flex flex-col gap-2">
          {q.options.map((o) => (
            <label
              key={o.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm",
                value?.optionId === o.id ? "border-primary bg-accent text-accent-foreground" : "border-border hover:bg-secondary",
              )}
            >
              <input
                type="radio"
                name={`q-${index}`}
                checked={value?.optionId === o.id}
                onChange={() => onChange({ optionId: o.id })}
                className="accent-primary"
              />
              {o.label}
            </label>
          ))}
        </div>
      );
  }
}
