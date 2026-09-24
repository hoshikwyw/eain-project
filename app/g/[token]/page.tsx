import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GiftReveal } from "@/components/gift/gift-reveal";
import { GiftView } from "@/components/gift/gift-view";
import { getPublicGift } from "@/features/gifts/public";
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

  return (
    <GiftReveal token={token} questions={gift.questions}>
      <GiftView
        sections={gift.sections}
        media={gift.media}
        variant={gift.variant}
        style={gift.style}
        recipientName={gift.recipientName}
        senderName={gift.senderName}
        animate
        questionMode="hidden"
      />
    </GiftReveal>
  );
}
