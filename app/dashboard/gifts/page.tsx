import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Lovebirds } from "@/components/brand/lovebirds";
import { PageHeader } from "@/components/dashboard/page-header";
import { ConfirmButton } from "@/components/gift/confirm-button";
import { GiftStatusChip } from "@/components/gift/gift-status-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteGift } from "@/features/gifts/actions";
import { listMyGifts } from "@/features/gifts/queries";

export default async function GiftsPage({ searchParams }: PageProps<"/dashboard/gifts">) {
  const t = await getTranslations("dashboard");
  const format = await getFormatter();
  const params = await searchParams;
  const gifts = await listMyGifts();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.gifts")}
        subtitle={t("gifts.count", { count: gifts.length, max: 5 })}
        action={
          <Button asChild disabled={gifts.length >= 5}>
            <Link href="/create">
              <Plus />
              {t("createNewGift")}
            </Link>
          </Button>
        }
      />

      {params.error === "limit" && (
        <p role="alert" className="rounded-xl bg-accent px-3.5 py-2.5 text-sm text-accent-foreground">
          {t("gifts.limitReached")}
        </p>
      )}
      {params.error === "delete" && (
        <p role="alert" className="rounded-xl bg-accent px-3.5 py-2.5 text-sm text-accent-foreground">
          {t("gifts.deleteFailed")}
        </p>
      )}
      {params.deleted === "1" && (
        <p role="status" className="rounded-xl bg-accent px-3.5 py-2.5 text-sm text-accent-foreground">
          {t("gifts.deleted")}
        </p>
      )}

      {gifts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="w-full max-w-60">
              <Lovebirds />
            </div>
            <p className="text-sm text-muted-foreground">{t("recentGiftsEmpty")}</p>
            <Button asChild variant="soft">
              <Link href="/create">{t("createFirstGift")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {gifts.map((gift) => {
            const chip = <GiftStatusChip status={gift.status} opened={Boolean(gift.recipient?.first_opened_at)} />;
            return (
              <li key={gift.id}>
                <Card className="transition-colors hover:bg-secondary/60">
                  <CardContent className="flex items-center gap-1 p-2 sm:gap-2">
                    {/* The row opens the gift's page; edit and delete sit beside it, never inside the link. */}
                    <Link
                      href={`/dashboard/gifts/${gift.id}`}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 focus-visible:outline-2 sm:gap-4"
                    >
                      <span className="bg-hero grid size-12 shrink-0 place-items-center rounded-xl font-display text-lg font-semibold sm:size-14">
                        {gift.title.trim().charAt(0).toUpperCase() || "♥"}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <p className="truncate font-semibold">{gift.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {gift.recipient?.name ? t("gifts.for", { name: gift.recipient.name }) : t("gifts.noRecipient")}
                          {" · "}
                          {format.relativeTime(new Date(gift.created_at))}
                        </p>
                        <span className="mt-1 sm:hidden">{chip}</span>
                      </div>
                      <span className="max-sm:hidden">{chip}</span>
                    </Link>
                    <Button asChild variant="secondary" size="sm" className="max-sm:px-2.5">
                      <Link href={`/create/${gift.id}`} aria-label={t("gifts.edit")}>
                        <Pencil />
                        <span className="max-sm:hidden">{t("gifts.edit")}</span>
                      </Link>
                    </Button>
                    <form action={deleteGift.bind(null, gift.id)}>
                      <ConfirmButton
                        variant="ghost"
                        size="sm"
                        className="text-destructive max-sm:px-2.5"
                        aria-label={t("gifts.delete")}
                        confirmText={t("gifts.deleteConfirm")}
                        confirmLabel={t("gifts.delete")}
                        danger
                      >
                        <Trash2 />
                        <span className="max-sm:hidden">{t("gifts.delete")}</span>
                      </ConfirmButton>
                    </form>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
