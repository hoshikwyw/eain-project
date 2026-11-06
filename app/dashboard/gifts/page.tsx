import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ConfirmButton } from "@/components/gift/confirm-button";
import { galleryGroups, isGalleryFilter } from "@/components/gift/gallery-filters";
import { GiftGallery } from "@/components/gift/gift-gallery";
import { GiftTile } from "@/components/gift/gift-tile";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteGift } from "@/features/gifts/actions";
import { listMyGiftCards } from "@/features/gifts/queries";
import { getCurrentProfile } from "@/features/profile/queries";
import { Notice } from "@/components/ui/notice";
import { PageTitle } from "@/components/ui/page-title";

/** The free limit, enforced by the database. Shown here so the count makes sense. */
const GIFT_LIMIT = 5;

/**
 * My Gifts: every gift as a picture, with tabs to narrow them down. Each
 * tile opens the gift and carries its own edit and delete buttons.
 */
export default async function GiftsPage({ searchParams }: PageProps<"/dashboard/gifts">) {
  const t = await getTranslations("dashboard");
  const params = await searchParams;
  const [cards, profile] = await Promise.all([listMyGiftCards(), getCurrentProfile()]);
  const full = cards.length >= GIFT_LIMIT;

  const items = cards.map((card) => ({
    id: card.gift.id,
    groups: galleryGroups(card),
    tile: (
      <GiftTile
        card={card}
        senderName={profile.display_name}
        actions={
          <div className="flex items-center gap-1.5">
            <Button asChild variant="secondary" size="sm" className="min-w-0 flex-1">
              <Link href={`/create/${card.gift.id}`}>
                <Pencil />
                {t("gifts.edit")}
              </Link>
            </Button>
            <form action={deleteGift.bind(null, card.gift.id)}>
              <ConfirmButton
                variant="ghost"
                size="sm"
                className="px-2.5 text-destructive"
                aria-label={t("gifts.delete")}
                title={t("gifts.delete")}
                confirmText={t("gifts.deleteConfirm")}
                confirmLabel={t("gifts.delete")}
                danger
              >
                <Trash2 />
              </ConfirmButton>
            </form>
          </div>
        }
      />
    ),
  }));

  // The last tile on the "all" tab: start a new gift, or why that is not possible.
  const tail = full ? (
    <div className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
      {t("gifts.limitReached")}
    </div>
  ) : (
    <Link
      href="/create"
      className="group flex aspect-[4/5] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border p-4 text-center text-sm font-semibold text-muted-foreground transition-colors outline-none hover:border-primary/50 hover:bg-secondary/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="grid size-12 place-items-center rounded-full bg-brand-soft text-accent-foreground transition-transform group-hover:scale-110 dark:text-brand">
        <Plus className="size-6" />
      </span>
      {t("createNewGift")}
    </Link>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <PageTitle>{t("nav.gifts")}</PageTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("gifts.count", { count: cards.length, max: GIFT_LIMIT })}
        </p>
      </div>

      {params.error === "limit" && <Notice role="alert">{t("gifts.limitReached")}</Notice>}
      {params.error === "delete" && <Notice role="alert">{t("gifts.deleteFailed")}</Notice>}
      {params.deleted === "1" && <Notice role="status">{t("gifts.deleted")}</Notice>}

      {cards.length === 0 ? (
        <EmptyState bird="pair" title={t("home.emptyTitle")} text={t("recentGiftsEmpty")}>
          <Button asChild>
            <Link href="/create">
              <Plus />
              {t("createFirstGift")}
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <GiftGallery
          items={items}
          initial={isGalleryFilter(params.filter) ? params.filter : "all"}
          tail={tail}
        />
      )}
    </div>
  );
}
