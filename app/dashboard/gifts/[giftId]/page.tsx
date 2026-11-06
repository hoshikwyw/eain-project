import { ArrowLeft, Check, Copy, EyeOff, Pencil, RefreshCw, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { ConfirmButton } from "@/components/gift/confirm-button";
import { GiftStatusChip } from "@/components/gift/gift-status-chip";
import { GiftView } from "@/components/gift/gift-view";
import { SharePanel } from "@/components/gift/share-panel";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  deleteGift,
  duplicateGift,
  publishGift,
  regenerateGiftLink,
  unpublishGift,
} from "@/features/gifts/actions";
import { getGiftDetail, getGiftResponses } from "@/features/gifts/queries";
import { getCurrentProfile } from "@/features/profile/queries";
import { makeQr } from "@/lib/qr";
import { getSiteOrigin, giftShareUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";
import type { GiftEventType } from "@/types/database";
import { Notice } from "@/components/ui/notice";
import { PageTitle } from "@/components/ui/page-title";
import { CapsLabel } from "@/components/ui/caps-label";

const TIMELINE = [
  "created",
  "published",
  "shared",
  "opened",
  "viewed",
  "responded",
] as const satisfies readonly GiftEventType[];

/** A white panel in the side column. */
const PANEL = "panel p-5 sm:p-6";
/** One action in the manage list: icon and label, full width, left aligned. */
const ROW = "h-12 w-full justify-start gap-3 rounded-2xl px-3";

/**
 * One gift's own page: the gift itself, large, next to everything the
 * creator does with it — pass it on, read the replies, see how far it has
 * travelled, and manage it. On a phone the share area comes first.
 */
export default async function GiftDetailPage({
  params,
  searchParams,
}: PageProps<"/dashboard/gifts/[giftId]">) {
  const { giftId } = await params;
  const query = await searchParams;
  const t = await getTranslations("dashboard.gifts");
  const tNav = await getTranslations("dashboard.nav");
  const format = await getFormatter();

  const [data, profile, responses] = await Promise.all([
    getGiftDetail(giftId),
    getCurrentProfile(),
    getGiftResponses(giftId),
  ]);
  if (!data) notFound();
  const hasQuestions = data.sections.some((s) => s.type === "question");

  const { gift, recipient, events } = data;
  const opened = Boolean(recipient?.first_opened_at);
  const isPublished = gift.status === "published";

  const origin = await getSiteOrigin();
  const shareUrl = giftShareUrl(origin, gift.share_token);
  const qr = isPublished ? await makeQr(shareUrl) : null;

  const firstOf = (type: GiftEventType) => events.find((e) => e.event_type === type);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/dashboard/gifts"
          className="inline-flex items-center gap-1.5 self-start rounded-full text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {tNav("gifts")}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <PageTitle className="break-words">{gift.title}</PageTitle>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <GiftStatusChip status={gift.status} opened={opened} />
              {recipient?.name ? t("for", { name: recipient.name }) : t("noRecipient")}
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href={`/create/${gift.id}`}>
              <Pencil />
              {t("edit")}
            </Link>
          </Button>
        </div>
      </div>

      {query.published === "1" && (
        <Notice role="status" tone="success">
          {t("justPublished")}
        </Notice>
      )}
      {query.regenerated === "1" && <Notice role="status">{t("linkRegenerated")}</Notice>}
      {query.error === "duplicate" && <Notice role="alert">{t("duplicateFailed")}</Notice>}

      {/* One column on phones and tablets; from laptop width the gift sits on the left and the rest in a side column. */}
      <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-6 lg:max-w-none lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-8">
        {/* Share */}
        <section className="bg-hero flex flex-col gap-4 rounded-3xl p-5 sm:p-6 lg:col-start-2 lg:row-start-1">
          <div>
            <h2 className="font-display text-xl font-semibold">{t("share")}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isPublished ? t("shareDescription") : t("publishToShare")}
            </p>
          </div>
          {isPublished && qr ? (
            <SharePanel
              giftId={gift.id}
              url={shareUrl}
              qrSvg={qr.svg}
              qrPngDataUrl={qr.pngDataUrl}
              title={gift.title}
            />
          ) : (
            <form action={publishGift.bind(null, gift.id)}>
              <SubmitButton className="w-full">
                <Send />
                {t("publishNow")}
              </SubmitButton>
            </form>
          )}
        </section>

        {/* The gift itself, as the person it is for will see it */}
        <section
          aria-labelledby="gift-preview"
          className="rounded-[2rem] border glass p-3 sm:p-8 lg:col-start-1 lg:row-span-2 lg:row-start-1"
        >
          <CapsLabel as="h2" id="gift-preview" className="pt-1 pb-3 text-center sm:pt-0 sm:pb-5">
            {t("preview")}
          </CapsLabel>
          <GiftView
            sections={data.sections}
            media={data.media}
            variant={data.variant}
            colors={data.colors}
            stickers={data.stickers}
            scene={data.scene}
            style={data.style}
            recipientName={recipient?.name ?? ""}
            senderName={profile.display_name}
          />
        </section>

        <div className="flex flex-col gap-6 lg:col-start-2 lg:row-start-2">
          {(hasQuestions || responses.length > 0) && (
            <section className={PANEL}>
              <h2 className="font-display text-lg font-semibold">
                {t("responses.title", { count: responses.length })}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {responses.length === 0 ? t("responses.empty") : t("responses.description")}
              </p>
              {responses.length > 0 && (
                <ul className="mt-4 flex flex-col gap-3">
                  {responses.map((r) => (
                    <li key={r.id} className="rounded-2xl bg-secondary/60 p-4">
                      <p className="mb-2 text-xs text-muted-foreground">
                        {format.dateTime(new Date(r.createdAt), {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      <dl className="flex flex-col gap-2">
                        {r.answers.map((a, i) => (
                          <div key={i}>
                            <dt className="text-xs font-semibold text-muted-foreground">
                              {a.prompt}
                            </dt>
                            <dd className="text-sm break-words whitespace-pre-line">{a.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* How far the gift has travelled */}
          <section className={PANEL}>
            <h2 className="font-display text-lg font-semibold">{t("activity")}</h2>
            <ol className="mt-4 flex flex-col">
              {TIMELINE.map((type, i) => {
                const event = firstOf(type);
                const last = i === TIMELINE.length - 1;
                return (
                  <li key={type} className="flex gap-3">
                    {/* The dot, and the line down to the next step. */}
                    <span className="flex flex-col items-center">
                      <span
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-full",
                          event ? "bg-success text-white" : "border-2 border-border bg-card",
                        )}
                      >
                        {event && <Check className="size-3.5" />}
                      </span>
                      {!last && (
                        <span
                          className={cn("w-0.5 flex-1", event ? "bg-success/40" : "bg-border")}
                        />
                      )}
                    </span>
                    <div className={cn("min-w-0", !last && "pb-4")}>
                      <p
                        className={cn(
                          "text-sm leading-6",
                          event ? "font-semibold" : "text-muted-foreground",
                        )}
                      >
                        {t(`events.${type}`)}
                      </p>
                      {event && (
                        <p className="text-xs text-muted-foreground">
                          {format.dateTime(new Date(event.created_at), {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      )}
                      {!event && type === "opened" && isPublished && (
                        <p className="text-xs text-muted-foreground">{t("notOpenedYet")}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className={cn(PANEL, "flex flex-col gap-1 p-3 sm:p-3")}>
            <h2 className="px-3 pt-2 pb-1 font-display text-lg font-semibold">{t("manage")}</h2>
            {isPublished ? (
              <form action={unpublishGift.bind(null, gift.id)}>
                <SubmitButton variant="ghost" className={ROW}>
                  <EyeOff />
                  {t("unpublish")}
                </SubmitButton>
              </form>
            ) : gift.status === "unpublished" ? (
              <form action={publishGift.bind(null, gift.id)}>
                <SubmitButton variant="ghost" className={ROW}>
                  <Send />
                  {t("publishAgain")}
                </SubmitButton>
              </form>
            ) : null}
            <form action={duplicateGift.bind(null, gift.id)}>
              <SubmitButton variant="ghost" className={ROW}>
                <Copy />
                {t("duplicate")}
              </SubmitButton>
            </form>
            <form action={regenerateGiftLink.bind(null, gift.id)}>
              <ConfirmButton variant="ghost" className={ROW} confirmText={t("regenerateConfirm")}>
                <RefreshCw />
                {t("regenerateLink")}
              </ConfirmButton>
            </form>
            <p className="px-3 pb-1 pl-10 text-xs text-muted-foreground">{t("regenerateHint")}</p>
            <form
              action={deleteGift.bind(null, gift.id)}
              className="mt-1 border-t border-border pt-1"
            >
              <ConfirmButton
                variant="ghost"
                className={cn(ROW, "text-destructive")}
                confirmText={t("deleteConfirm")}
                danger
              >
                <Trash2 />
                {t("delete")}
              </ConfirmButton>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
