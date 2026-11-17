"use client";

import { RotateCcw, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { GiftClosed } from "@/components/gift/gift-closed";
import { openingDuration } from "@/components/gift/gift-opening";
import { GiftView } from "@/components/gift/gift-view";
import { SceneFrame } from "@/components/scene/scene-frame";
import { Button } from "@/components/ui/button";
import { sampleGift } from "@/features/gifts/sample-gift";
import type { Section } from "@/features/gifts/schemas";
import { defaultScene, sceneConfig } from "@/features/gifts/scene";
import { getTemplateStyle, isInvitationDesign } from "@/features/gifts/templates";

type Stage = "closed" | "opening" | "open";

type Props = {
  slug: string;
  locale: "en" | "my";
  /** Height of the closed stage; by default it fills its frame. */
  closedClassName?: string;
};

/**
 * The receiver's experience of a template, replayed with a sample gift: the
 * closed gift, the opening animation, then the finished card at the size a
 * receiver sees it (or the animation, for a scene template). Nothing is
 * recorded; it can be watched again.
 */
export function TemplateDemo({ slug, locale, closedClassName = "min-h-full" }: Props) {
  const t = useTranslations("gift");
  const tDemo = useTranslations("create.demo");
  const sample = useMemo(() => sampleGift(slug, locale), [slug, locale]);
  const [stage, setStage] = useState<Stage>("closed");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (!sample) return null;

  const open = () => {
    if (stage !== "closed") return;
    setStage("opening");
    timer.current = window.setTimeout(() => setStage("open"), openingDuration(sample.opening));
  };

  if (stage !== "open") {
    return (
      <GiftClosed
        opening={sample.opening}
        variant={sample.variant}
        stage={stage}
        recipientName={sample.recipientName}
        invitation={isInvitationDesign(getTemplateStyle(slug).design)}
        onOpen={open}
        className={closedClassName}
      />
    );
  }

  const names = { recipient: sample.recipientName, sender: sample.senderName };
  return (
    <div className="mx-auto flex w-full max-w-2xl animate-in flex-col gap-6 px-4 py-8 duration-700 zoom-in-95 fade-in">
      {sample.scene ? (
        <div className="mx-auto h-[min(70svh,46rem)] w-full max-w-md overflow-hidden rounded-3xl shadow-soft">
          <SceneFrame
            kind={sample.scene}
            title={t("sceneTitle")}
            config={sceneConfig(sample.sections, defaultScene, names, t("tapToBloom"))}
          />
        </div>
      ) : (
        <GiftView
          sections={sample.sections}
          media={sample.media}
          variant={sample.variant}
          style={getTemplateStyle(slug)}
          recipientName={sample.recipientName}
          senderName={sample.senderName}
          animate
          questionMode="preview"
        />
      )}
      <DemoReply
        questions={sample.sections.filter(isQuestion).map((q) => q.content)}
        invitation={isInvitationDesign(getTemplateStyle(slug).design)}
      />
      <div className="flex justify-center">
        <Button type="button" variant="ghost" size="sm" onClick={() => setStage("closed")}>
          <RotateCcw />
          {tDemo("replay")}
        </Button>
      </div>
    </div>
  );
}

type QuestionSection = Extract<Section, { type: "question" }>;
const isQuestion = (s: Section): s is QuestionSection => s.type === "question";

/**
 * The reply card as the receiver gets it under a gift with a question: the
 * real one's words and shape, nothing wired up, so what comes back to the
 * creator is understood before they start. Shows the template's own
 * questions when it starts with some (an invitation's name and RSVP),
 * otherwise one sample question.
 */
function DemoReply({
  questions,
  invitation,
}: {
  questions: QuestionSection["content"][];
  invitation: boolean;
}) {
  const t = useTranslations("gift.response");
  const w = (key: "title" | "subtitle" | "send") => (invitation ? t(`rsvp.${key}`) : t(key));
  const tDemo = useTranslations("create.demo");
  const id = useId();
  const shown =
    questions.length > 0 ? questions : [{ prompt: tDemo("replyQuestion"), options: [] }];
  return (
    <div className="flex flex-col gap-5 panel p-6 sm:p-8">
      <div>
        <h2 className="font-display text-2xl font-semibold">{w("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{w("subtitle")}</p>
      </div>
      {shown.map((q, i) => (
        <div key={`${id}-${i}`} className="flex flex-col gap-3">
          <label htmlFor={`${id}-${i}`} className="font-semibold">
            {q.prompt}
          </label>
          {q.options.length > 0 ? (
            <div id={`${id}-${i}`} className="flex flex-col gap-2">
              {q.options.map((o) => (
                <span
                  key={o.id}
                  className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm"
                >
                  <span
                    aria-hidden="true"
                    className="size-4 rounded-full border-2 border-primary"
                  />
                  {o.label}
                </span>
              ))}
            </div>
          ) : (
            <textarea
              id={`${id}-${i}`}
              readOnly
              rows={i === 0 && shown.length > 1 ? 1 : 3}
              placeholder={t("textPlaceholder")}
              className="w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none"
            />
          )}
        </div>
      ))}
      <Button type="button" size="lg" disabled className="self-start">
        <Send />
        {w("send")}
      </Button>
      <p className="text-xs text-muted-foreground">{tDemo("replyNote")}</p>
    </div>
  );
}
