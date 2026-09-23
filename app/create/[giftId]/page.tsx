import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { GiftEditor } from "@/components/editor/gift-editor";
import { Logo } from "@/components/brand/logo";
import { GiftStatusChip } from "@/components/gift/gift-status-chip";
import { LocaleToggle } from "@/components/settings/locale-toggle";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { Button } from "@/components/ui/button";
import { getEditorGift } from "@/features/gifts/queries";
import { getCurrentProfile } from "@/features/profile/queries";

export default async function EditGiftPage({ params, searchParams }: PageProps<"/create/[giftId]">) {
  const { giftId } = await params;
  const query = await searchParams;
  const t = await getTranslations("editor");

  const [data, profile] = await Promise.all([getEditorGift(giftId), getCurrentProfile()]);
  if (!data) notFound();

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label={t("back")}>
            <Link href="/dashboard/gifts">
              <ArrowLeft />
            </Link>
          </Button>
          <Logo />
          <GiftStatusChip status={data.gift.status} opened={Boolean(data.recipient?.first_opened_at)} />
        </div>
        <div className="flex items-center gap-1.5">
          <LocaleToggle />
          <ThemeToggle />
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pt-2 pb-28">
        <GiftEditor
          giftId={data.gift.id}
          status={data.gift.status}
          title={data.gift.title}
          recipientName={data.recipient?.name ?? ""}
          variant={data.variant}
          sections={data.sections}
          media={Object.values(data.media)}
          style={data.style}
          senderName={profile.display_name}
          publishError={query.error === "publish"}
        />
      </div>
    </main>
  );
}
