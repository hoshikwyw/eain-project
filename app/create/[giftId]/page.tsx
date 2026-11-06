import { notFound } from "next/navigation";
import { GiftEditor } from "@/components/editor/gift-editor";
import { getEditorGift } from "@/features/gifts/queries";
import { getCurrentProfile } from "@/features/profile/queries";

/**
 * The gift editor. It takes the whole screen: its own bar on top (back, the
 * gift's name, undo, save, publish) and no app frame around it, so nothing
 * competes with the gift being made.
 */
export default async function EditGiftPage({
  params,
  searchParams,
}: PageProps<"/create/[giftId]">) {
  const { giftId } = await params;
  const query = await searchParams;

  const [data, profile] = await Promise.all([getEditorGift(giftId), getCurrentProfile()]);
  if (!data) notFound();

  return (
    <main className="flex flex-1 flex-col">
      <GiftEditor
        giftId={data.gift.id}
        status={data.gift.status}
        opened={Boolean(data.recipient?.first_opened_at)}
        title={data.gift.title}
        recipientName={data.recipient?.name ?? ""}
        variant={data.variant}
        opening={data.opening}
        colors={data.colors}
        stickers={data.stickers}
        scene={data.scene}
        sections={data.sections}
        media={Object.values(data.media)}
        style={data.style}
        senderName={profile.display_name}
        publishError={query.error === "publish"}
      />
    </main>
  );
}
