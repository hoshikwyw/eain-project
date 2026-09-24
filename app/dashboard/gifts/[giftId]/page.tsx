import { Check, Circle, Copy, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { ConfirmButton } from "@/components/gift/confirm-button";
import { GiftStatusChip } from "@/components/gift/gift-status-chip";
import { GiftView } from "@/components/gift/gift-view";
import { SharePanel } from "@/components/gift/share-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteGift, duplicateGift, publishGift, regenerateGiftLink, unpublishGift } from "@/features/gifts/actions";
import { getGiftDetail, getGiftResponses } from "@/features/gifts/queries";
import { getCurrentProfile } from "@/features/profile/queries";
import { makeQr } from "@/lib/qr";
import { getSiteOrigin, giftShareUrl } from "@/lib/site-url";
import type { GiftEventType } from "@/types/database";

const TIMELINE = ["created", "published", "opened", "viewed", "responded"] as const satisfies readonly GiftEventType[];

export default async function GiftDetailPage({ params, searchParams }: PageProps<"/dashboard/gifts/[giftId]">) {
  const { giftId } = await params;
  const query = await searchParams;
  const t = await getTranslations("dashboard.gifts");
  const format = await getFormatter();

  const [data, profile, responses] = await Promise.all([getGiftDetail(giftId), getCurrentProfile(), getGiftResponses(giftId)]);
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
      <PageHeader
        title={gift.title}
        subtitle={recipient?.name ? t("for", { name: recipient.name }) : t("noRecipient")}
        action={
          <div className="flex items-center gap-2">
            <GiftStatusChip status={gift.status} opened={opened} />
            <Button asChild variant="secondary" size="sm">
              <Link href={`/create/${gift.id}`}>
                <Pencil />
                {t("edit")}
              </Link>
            </Button>
          </div>
        }
      />

      {query.published === "1" && (
        <p role="status" className="rounded-xl bg-success-soft px-3.5 py-2.5 text-sm text-success">
          {t("justPublished")}
        </p>
      )}
      {query.regenerated === "1" && (
        <p role="status" className="rounded-xl bg-accent px-3.5 py-2.5 text-sm text-accent-foreground">
          {t("linkRegenerated")}
        </p>
      )}
      {query.error === "duplicate" && (
        <p role="alert" className="rounded-xl bg-accent px-3.5 py-2.5 text-sm text-accent-foreground">
          {t("duplicateFailed")}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("share")}</CardTitle>
              <CardDescription>{isPublished ? t("shareDescription") : t("publishToShare")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isPublished && qr ? (
                <SharePanel url={shareUrl} qrSvg={qr.svg} qrPngDataUrl={qr.pngDataUrl} title={gift.title} />
              ) : (
                <form action={publishGift.bind(null, gift.id)}>
                  <SubmitButton>{t("publishNow")}</SubmitButton>
                </form>
              )}
            </CardContent>
          </Card>

          {(hasQuestions || responses.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>{t("responses.title", { count: responses.length })}</CardTitle>
                <CardDescription>{responses.length === 0 ? t("responses.empty") : t("responses.description")}</CardDescription>
              </CardHeader>
              {responses.length > 0 && (
                <CardContent>
                  <ul className="flex flex-col gap-3">
                    {responses.map((r) => (
                      <li key={r.id} className="rounded-xl border border-border p-4">
                        <p className="mb-2 text-xs text-muted-foreground">
                          {format.dateTime(new Date(r.createdAt), { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                        <dl className="flex flex-col gap-2">
                          {r.answers.map((a, i) => (
                            <div key={i}>
                              <dt className="text-xs font-semibold text-muted-foreground">{a.prompt}</dt>
                              <dd className="text-sm whitespace-pre-line">{a.value}</dd>
                            </div>
                          ))}
                        </dl>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t("preview")}</CardTitle>
            </CardHeader>
            <CardContent>
              <GiftView
                sections={data.sections}
                media={data.media}
                variant={data.variant}
                style={data.style}
                recipientName={recipient?.name ?? ""}
                senderName={profile.display_name}
                compact
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("activity")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-3">
                {TIMELINE.map((type) => {
                  const event = firstOf(type);
                  return (
                    <li key={type} className="flex items-start gap-3">
                      <span
                        className={
                          event
                            ? "mt-0.5 grid size-5 place-items-center rounded-full bg-success text-white"
                            : "mt-0.5 grid size-5 place-items-center rounded-full border border-border text-muted-foreground"
                        }
                      >
                        {event ? <Check className="size-3" /> : <Circle className="size-2" />}
                      </span>
                      <div>
                        <p className={event ? "text-sm font-semibold" : "text-sm text-muted-foreground"}>{t(`events.${type}`)}</p>
                        {event && (
                          <p className="text-xs text-muted-foreground">
                            {format.dateTime(new Date(event.created_at), { dateStyle: "medium", timeStyle: "short" })}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("manage")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {isPublished ? (
                <form action={unpublishGift.bind(null, gift.id)}>
                  <SubmitButton variant="secondary" className="w-full">
                    {t("unpublish")}
                  </SubmitButton>
                </form>
              ) : gift.status === "unpublished" ? (
                <form action={publishGift.bind(null, gift.id)}>
                  <SubmitButton variant="secondary" className="w-full">
                    {t("publishAgain")}
                  </SubmitButton>
                </form>
              ) : null}
              <form action={duplicateGift.bind(null, gift.id)}>
                <SubmitButton variant="secondary" className="w-full">
                  <Copy />
                  {t("duplicate")}
                </SubmitButton>
              </form>
              <form action={regenerateGiftLink.bind(null, gift.id)}>
                <ConfirmButton variant="secondary" className="w-full" confirmText={t("regenerateConfirm")}>
                  {t("regenerateLink")}
                </ConfirmButton>
              </form>
              <p className="text-xs text-muted-foreground">{t("regenerateHint")}</p>
              <form action={deleteGift.bind(null, gift.id)} className="pt-2">
                <ConfirmButton variant="ghost" className="w-full text-destructive" confirmText={t("deleteConfirm")}>
                  {t("delete")}
                </ConfirmButton>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
