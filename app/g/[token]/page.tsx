import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GiftReveal } from "@/components/gift/gift-reveal";
import { GiftView } from "@/components/gift/gift-view";
import { SceneFrame } from "@/components/scene/scene-frame";
import { getPublicGift } from "@/features/gifts/public";
import { sceneConfig } from "@/features/gifts/scene";
import { GiftUnavailable } from "./unavailable";

/** The same picture for every gift: a wrapped present, made by scripts/compose-gift-preview.mjs. */
const PREVIEW_IMAGE = "/brand/gift-preview.png";

/**
 * Generic metadata on purpose: chat apps fetch this for link previews, and
 * the preview must never reveal the message, names or photos. Every gift
 * link shows the same title, line and picture of a present.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("gift");
  const title = t("previewShare");
  const description = t("previewDescription");
  return {
    title: t("previewTitle"),
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      siteName: "Eain",
      type: "website",
      images: [{ url: PREVIEW_IMAGE, width: 1200, height: 630, type: "image/png", alt: t("previewImageAlt") }],
    },
    twitter: { card: "summary_large_image", title, description, images: [PREVIEW_IMAGE] },
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
