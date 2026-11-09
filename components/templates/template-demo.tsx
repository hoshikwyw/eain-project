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
import { defaultScene, sceneConfig } from "@/features/gifts/scene";
import { getTemplateStyle } from "@/features/gifts/templates";

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
      <DemoReply />
      <div className="flex justify-center">
        <Button type="button" variant="ghost" size="sm" onClick={() => setStage("closed")}>
          <RotateCcw />
          {tDemo("replay")}
        </Button>
      </div>
    </div>
  );
}

/**
 * The reply card as the receiver gets it under a gift with a question: the
 * real one's words and shape, with a sample question and nothing wired up,
 * so what comes back to the creator is understood before they start.
 */
function DemoReply() {
  const t = useTranslations("gift.response");
  const tDemo = useTranslations("create.demo");
  const id = useId();
  return (
    <div className="flex flex-col gap-5 panel p-6 sm:p-8">
      <div>
        <h2 className="font-display text-2xl font-semibold">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <div className="flex flex-col gap-3">
        <label htmlFor={id} className="font-semibold">
          {tDemo("replyQuestion")}
        </label>
        <textarea
          id={id}
          readOnly
          rows={3}
          placeholder={t("textPlaceholder")}
          className="w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none"
        />
      </div>
      <Button type="button" size="lg" disabled className="self-start">
        <Send />
        {t("send")}
      </Button>
      <p className="text-xs text-muted-foreground">{tDemo("replyNote")}</p>
    </div>
  );
}
