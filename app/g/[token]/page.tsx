import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GiftReveal } from "@/components/gift/gift-reveal";
import { GiftView } from "@/components/gift/gift-view";
import { SceneFrame } from "@/components/scene/scene-frame";
import { getPublicGift } from "@/features/gifts/public";
import { sceneConfig } from "@/features/gifts/scene";
import { GiftUnavailable } from "./unavailable";

/**
 * Generic metadata on purpose: chat apps fetch this for link previews, and
 * the preview must never reveal the message, names or photos.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("gift");
  return {
    title: t("previewTitle"),
    description: t("someone"),
    robots: { index: false, follow: false },
    openGraph: { title: t("previewTitle"), description: t("someone"), siteName: "Eain" },
  };
}

export default async function PublicGiftPage({ params }: PageProps<"/g/[token]">) {
  const { token } = await params;
  const gift = await getPublicGift(token);

  if (!gift) return <GiftUnavailable />;

  const t = await getTranslations("gift");

  return (
    <GiftReveal
      token={token}
      questions={gift.questions}
      opening={gift.opening}
      variant={gift.variant}
      colors={gift.colors}
      recipientName={gift.recipientName}
    >
      {gift.style.scene ? (
        // A scene template: the animation plays in a tall, phone-shaped frame.
        <div className="mx-auto h-[min(86svh,46rem)] w-full max-w-md overflow-hidden rounded-3xl shadow-soft">
          <SceneFrame
            kind={gift.style.scene}
            title={t("sceneTitle")}
            config={sceneConfig(
              gift.sections,
              gift.scene,
              { recipient: gift.recipientName, sender: gift.senderName },
              t("tapToBloom"),
            )}
          />
        </div>
      ) : (
        <GiftView
          sections={gift.sections}
          media={gift.media}
          variant={gift.variant}
          colors={gift.colors}
          stickers={gift.stickers}
          style={gift.style}
          recipientName={gift.recipientName}
          senderName={gift.senderName}
          animate
          questionMode="hidden"
        />
      )}
    </GiftReveal>
  );
}
