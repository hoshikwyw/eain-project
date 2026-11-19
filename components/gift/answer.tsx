"use client";

import { Check, Send } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { PublicQuestion } from "@/features/gifts/schemas";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/**
 * Answering a gift's questions inside the card itself. The provider owns the
 * answers and the sending; each question section on the card renders a
 * QuestionSlot that reads and writes through it, and the last slot carries
 * the send button. No account, one submission per browser session.
 */

type Answer = { optionId?: string; text?: string; number?: number };
/** One answer as the responses route reads it back. */
type SentAnswer = {
  questionId: string;
  optionId: string | null;
  text: string | null;
  number: number | null;
};
type State = "idle" | "sending" | "sent" | "duplicate" | "error" | "invalid" | "closed";

type Store = {
  questions: PublicQuestion[];
  answers: Record<string, Answer>;
  set: (questionId: string, answer: Answer) => void;
  state: State;
  submit: () => void;
  /** Unlocks the card so the same browser can answer again. */
  change: () => void;
  invitation: boolean;
  demo: boolean;
  /** The RSVP deadline, when it has passed: the card shows it and takes nothing. */
  closedOn?: string;
  /** The guest picked the "no" of a yes/no question: a headcount is not asked. */
  declined: boolean;
};

const AnswerContext = createContext<Store | null>(null);

type ProviderProps = {
  questions: PublicQuestion[];
  invitation?: boolean;
  /** Set when the host's RSVP deadline has passed: that date, "YYYY-MM-DD". */
  closedOn?: string;
  children: React.ReactNode;
} & (
  | {
      /** The gift's share token; answers are posted to its responses route. */
      token: string;
      sessionId: () => string;
      onStarted: () => void;
      demo?: false;
    }
  | {
      /** A preview: answers stay on the page and "sending" only pretends. */
      demo: true;
      token?: undefined;
      sessionId?: undefined;
      onStarted?: undefined;
    }
);

export function AnswerProvider(props: ProviderProps) {
  const { questions, invitation = false, children } = props;
  const t = useTranslations("gift.response");
  const w = (key: "sentTitle" | "sentText") => (invitation ? t(`rsvp.${key}`) : t(key));
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const doneKey = props.demo ? null : `eain_responded_${props.token}`;
  // The card mounts only after the receiver taps "open", so it never renders
  // on the server and reading localStorage in the initialiser is safe.
  const [state, setState] = useState<State>(() => {
    try {
      return doneKey && window.localStorage.getItem(doneKey) ? "sent" : "idle";
    } catch {
      return "idle";
    }
  });
  const started = useRef(false);
  // True once the guest asked to change an answer already sent: the next send replaces it.
  const replacing = useRef(false);

  // Back on a card they already answered: fetch what they said, so the card shows it
  // filled in and locked. If the creator has since removed the reply, the card opens again.
  const token = props.demo ? undefined : props.token;
  const sessionId = props.demo ? undefined : props.sessionId;
  const restore = useRef(state === "sent" && Boolean(token));
  useEffect(() => {
    if (!restore.current || !token || !sessionId) return;
    // Dev strict mode mounts twice; the flag clears only once an answer arrives.
    let stale = false;
    fetch(`/api/g/${token}/responses?session=${encodeURIComponent(sessionId())}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { answers?: SentAnswer[] } | null) => {
        if (stale || !data?.answers) return;
        restore.current = false;
        if (data.answers.length === 0) {
          try {
            if (doneKey) window.localStorage.removeItem(doneKey);
          } catch {
            // ignore
          }
          setState("idle");
          return;
        }
        const restored: Record<string, Answer> = {};
        for (const a of data.answers) {
          restored[a.questionId] = {
            ...(a.optionId && { optionId: a.optionId }),
            ...(a.text && { text: a.text }),
            ...(a.number !== null && { number: a.number }),
          };
        }
        setAnswers(restored);
      })
      .catch(() => {
        // Offline or blocked: the card still says the reply was sent.
      });
    return () => {
      stale = true;
    };
  }, [token, sessionId, doneKey]);

  function change() {
    if (props.closedOn) return;
    // The earlier answers stay filled in: the guest changes what they want and sends again.
    replacing.current = true;
    setState("idle");
  }

  function set(questionId: string, answer: Answer) {
    if (props.closedOn || state === "closed") return;
    if (state === "sent" || state === "duplicate" || state === "sending") return;
    if (!started.current) {
      started.current = true;
      if (!props.demo) props.onStarted();
    }
    setAnswers((a) => ({ ...a, [questionId]: answer }));
    if (state === "invalid" || state === "error") setState("idle");
  }

  // A "no" on a yes/no question (its second option) makes a headcount pointless.
  const declined = hasDeclined(questions, answers);
  // The questions a reply is made of: a headcount stays out once the guest said no.
  const asked = declined ? questions.filter((q) => q.kind !== "count") : questions;

  async function submit() {
    if (props.closedOn || state === "closed") return;
    if (state === "sending" || state === "sent" || state === "duplicate") return;
    const missing = asked.some((q) => q.required && !isAnswered(q, answers[q.id]));
    const payload = asked
      .filter((q) => isAnswered(q, answers[q.id]))
      .map((q) => ({
        questionId: q.id,
        optionId: answers[q.id]?.optionId ?? null,
        text: answers[q.id]?.text?.trim() || null,
        number: answers[q.id]?.number ?? null,
      }));
    if (missing || payload.length === 0) {
      setState("invalid");
      return;
    }
    if (props.demo) {
      setState("sent");
      return;
    }
    setState("sending");
    try {
      const res = await fetch(`/api/g/${props.token}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: props.sessionId(),
          answers: payload,
          ...(replacing.current && { replace: true }),
        }),
      });
      if (res.ok || res.status === 409) {
        try {
          if (doneKey) window.localStorage.setItem(doneKey, "1");
        } catch {
          // ignore
        }
        if (res.ok) replacing.current = false;
        setState(res.ok ? "sent" : "duplicate");
        if (res.ok) toast.success(w("sentTitle"), { description: w("sentText") });
        else toast.info(t("alreadyText"));
      } else if (res.status === 400) {
        setState("invalid");
      } else if (res.status === 410) {
        // The deadline passed while the card was open.
        setState("closed");
      } else {
        setState("error");
        toast.error(t("error"));
      }
    } catch {
      setState("error");
      toast.error(t("error"));
    }
  }

  return (
    <AnswerContext.Provider
      value={{
        questions,
        answers,
        set,
        state,
        submit,
        change,
        invitation,
        demo: Boolean(props.demo),
        closedOn: props.closedOn,
        declined,
      }}
    >
      {children}
    </AnswerContext.Provider>
  );
}

function hasDeclined(questions: PublicQuestion[], answers: Record<string, Answer>): boolean {
  return questions.some(
    (q) =>
      q.kind === "yes_no" && Boolean(q.options[1]) && answers[q.id]?.optionId === q.options[1].id,
  );
}

function isAnswered(q: PublicQuestion, a: Answer | undefined): boolean {
  if (!a) return false;
  if (q.kind === "short_text") return Boolean(a.text && a.text.trim());
  if (q.kind === "rating" || q.kind === "count") return typeof a.number === "number";
  return Boolean(a.optionId);
}

const RATINGS = [1, 2, 3, 4, 5];
/** A headcount runs to ten; a bigger party can reply twice. */
const COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Controls drawn in the card's own colours, so they belong to the look rather than the site. */
const control =
  "border-[color:var(--t-accent-soft)] bg-[color:var(--t-card)] text-[color:var(--t-fg)] transition-colors";
const chosen = "border-[color:var(--t-accent)] bg-[color:var(--t-accent-soft)]";
const focus = "outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--t-accent)]/50";

/**
 * One question, answered in place on the card. Rendered by the gift's
 * question section when the card is in answer mode; the last question also
 * carries the send button and, once sent, the thank-you line.
 */
export function QuestionSlot({
  questionId,
  last,
  prompt,
  required,
}: {
  questionId: string;
  last: boolean;
  prompt: string;
  required: boolean;
}) {
  const store = useContext(AnswerContext);
  const t = useTranslations("gift.response");
  const format = useFormatter();
  if (!store) return null;
  const q = store.questions.find((x) => x.id === questionId);
  if (!q) return null;
  const { state, invitation } = store;
  const done = state === "sent" || state === "duplicate";
  const closed = Boolean(store.closedOn) || state === "closed";
  // "How many of you?" is not asked of someone who cannot come.
  const skipped = q.kind === "count" && store.declined;
  const w = (
    key: "send" | "sentTitle" | "sentText" | "change" | "closed" | "closedShort",
    values?: Record<string, string>,
  ) => (invitation ? t(`rsvp.${key}`, values) : t(key, values));
  const closedText = store.closedOn
    ? w("closed", {
        date: format.dateTime(new Date(`${store.closedOn}T00:00:00`), { dateStyle: "long" }),
      })
    : w("closedShort");
  const value = store.answers[q.id];

  return (
    <div className="question flex flex-col gap-3 rounded-2xl border border-[color:var(--t-accent-soft)] p-4 text-left">
      <p className="font-semibold">
        {prompt}
        {required && !done && !closed && !skipped && (
          <span aria-hidden="true" className="ml-1 text-[color:var(--t-accent)]">
            *
          </span>
        )}
      </p>
      {skipped ? (
        <p className="text-sm text-[color:var(--t-muted)]">{t("noHeadcount")}</p>
      ) : (
        <QuestionInput
          question={q}
          value={value}
          disabled={done || closed || state === "sending"}
          onChange={(a) => store.set(q.id, a)}
        />
      )}
      {last && (
        <div className="mt-1 flex flex-col gap-2">
          {state === "invalid" && (
            <p role="alert" className="text-sm text-[color:var(--t-accent)]">
              {t("invalid")}
            </p>
          )}
          {state === "error" && (
            <p role="alert" className="text-sm text-[color:var(--t-accent)]">
              {t("error")}
            </p>
          )}
          {done ? (
            <p role="status" className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-[color:var(--t-accent)]" />
              <span>
                <span className="font-semibold">{w("sentTitle")}</span>{" "}
                <span className="text-[color:var(--t-muted)]">
                  {state === "sent" ? w("sentText") : t("alreadyText")}
                </span>{" "}
                {!store.demo && !closed && (
                  <button
                    type="button"
                    onClick={store.change}
                    className={cn(
                      "mt-1 inline-flex touch-min items-center rounded-full border px-4 text-sm font-semibold text-[color:var(--t-accent)]",
                      control,
                      focus,
                    )}
                  >
                    {w("change")}
                  </button>
                )}
              </span>
            </p>
          ) : closed ? (
            <p role="status" className="text-sm text-[color:var(--t-muted)]">
              {closedText}
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void store.submit()}
                disabled={state === "sending"}
                className={cn(
                  "inline-flex touch-min w-fit items-center gap-2 rounded-full bg-[color:var(--t-accent)] px-5 py-2.5 text-sm font-semibold text-[color:var(--t-on-accent,#fff)] shadow-sm transition-opacity disabled:opacity-60",
                  focus,
                )}
              >
                <Send className="size-4" />
                {state === "sending" ? t("sending") : w("send")}
              </button>
              <p className="text-xs text-[color:var(--t-muted)]">{t("privacy")}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * What the creator sees in the editor and on the dashboard: the question as
 * the receiver will get it, drawn with the same controls but inert, with a
 * small note that it is theirs to answer. The last question shows the send
 * button too, so the whole reply is pictured.
 */
export function QuestionPreview({
  question,
  last,
  invitation,
  note,
}: {
  question: PublicQuestion;
  last: boolean;
  invitation: boolean;
  note: string;
}) {
  const t = useTranslations("gift.response");
  return (
    <div
      aria-label={note}
      className="question flex flex-col gap-3 rounded-2xl border border-dashed border-[color:var(--t-accent-soft)] p-4 text-left"
    >
      <p className="text-xs font-semibold tracking-[0.18em] text-[color:var(--t-muted)] uppercase">
        {note}
      </p>
      <p className="font-semibold">
        {question.prompt || "…"}
        {question.required && (
          <span aria-hidden="true" className="ml-1 text-[color:var(--t-accent)]">
            *
          </span>
        )}
      </p>
      <div className="pointer-events-none" aria-hidden="true">
        <QuestionInput question={question} value={undefined} disabled={false} onChange={() => {}} />
      </div>
      {last && (
        <div className="pointer-events-none mt-1 flex flex-col gap-2" aria-hidden="true">
          <span className="inline-flex touch-min w-fit items-center gap-2 rounded-full bg-[color:var(--t-accent)] px-5 py-2.5 text-sm font-semibold text-[color:var(--t-on-accent,#fff)] shadow-sm">
            <Send className="size-4" />
            {invitation ? t("rsvp.send") : t("send")}
          </span>
          <p className="text-xs text-[color:var(--t-muted)]">{t("privacy")}</p>
        </div>
      )}
    </div>
  );
}

function QuestionInput({
  question: q,
  value,
  disabled,
  onChange,
}: {
  question: PublicQuestion;
  value: Answer | undefined;
  disabled: boolean;
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
          disabled={disabled}
          maxLength={1000}
          rows={2}
          placeholder={t("textPlaceholder")}
          className={cn(
            "w-full rounded-xl border px-3.5 py-2.5 text-sm placeholder:text-[color:var(--t-muted)] disabled:opacity-80",
            control,
            focus,
          )}
        />
      );
    case "rating":
    case "count": {
      const numbers = q.kind === "count" ? COUNTS : RATINGS;
      const any = typeof value?.number === "number";
      return (
        <Radios label={q.prompt} className="flex flex-wrap touch-gap">
          {numbers.map((n, i) => {
            const picked = value?.number === n;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={picked}
                aria-label={String(n)}
                tabIndex={rovingTab(picked, any, i)}
                disabled={disabled}
                onClick={() => onChange({ number: n })}
                className={cn(
                  "size-10 touch-min rounded-full border text-base font-semibold",
                  control,
                  focus,
                  picked && chosen,
                  disabled && !picked && "opacity-50",
                )}
              >
                {n}
              </button>
            );
          })}
        </Radios>
      );
    }
    case "reaction": {
      const any = Boolean(value?.optionId);
      return (
        <Radios label={q.prompt} className="flex flex-wrap touch-gap">
          {q.options.map((o, i) => {
            const picked = value?.optionId === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={picked}
                aria-label={o.label}
                tabIndex={rovingTab(picked, any, i)}
                disabled={disabled}
                onClick={() => onChange({ optionId: o.id })}
                className={cn(
                  "grid size-11 touch-min place-items-center rounded-full border text-xl transition-transform",
                  control,
                  focus,
                  picked && cn(chosen, "scale-110"),
                  disabled && !picked && "opacity-50",
                )}
              >
                {o.label}
              </button>
            );
          })}
        </Radios>
      );
    }
    case "choice":
    case "yes_no":
    default: {
      const any = Boolean(value?.optionId);
      return (
        <Radios label={q.prompt} className="flex flex-col touch-gap">
          {q.options.map((o, i) => {
            const picked = value?.optionId === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={picked}
                tabIndex={rovingTab(picked, any, i)}
                disabled={disabled}
                onClick={() => onChange({ optionId: o.id })}
                className={cn(
                  "flex touch-min items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm",
                  control,
                  focus,
                  picked && chosen,
                  disabled && !picked && "opacity-50",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-4 shrink-0 place-items-center rounded-full border-2 border-[color:var(--t-accent)]",
                    picked && "bg-[color:var(--t-accent)]",
                  )}
                >
                  {picked && <Check className="size-3 text-[color:var(--t-on-accent,#fff)]" />}
                </span>
                {o.label}
              </button>
            );
          })}
        </Radios>
      );
    }
  }
}

/**
 * One tab stop per group, like native radios: the chosen option is the stop,
 * or the first option while nothing is chosen.
 */
const rovingTab = (picked: boolean, anyPicked: boolean, index: number) =>
  picked || (!anyPicked && index === 0) ? 0 : -1;

/**
 * A radio group made of buttons, with the keyboard behaviour of real radios:
 * arrow keys move between the options and choose as they go, wrapping at the
 * ends. Tab leaves the group.
 */
function Radios({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = STEPS[e.key];
    if (!step || !ref.current) return;
    const items = [...ref.current.querySelectorAll<HTMLButtonElement>("[role=radio]:enabled")];
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0) return;
    e.preventDefault();
    const next = items[(at + step + items.length) % items.length];
    next.focus();
    next.click();
  }
  return (
    <div ref={ref} role="radiogroup" aria-label={label} className={className} onKeyDown={onKeyDown}>
      {children}
    </div>
  );
}

const STEPS: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
