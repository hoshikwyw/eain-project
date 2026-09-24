import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { AdminFlash } from "@/components/admin/flash";
import { PageHeader } from "@/components/dashboard/page-header";
import { ConfirmButton } from "@/components/gift/confirm-button";
import { GiftStatusChip } from "@/components/gift/gift-status-chip";
import { GiftView } from "@/components/gift/gift-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { disableGift } from "@/features/admin/actions";
import { getGiftForModeration, requireAdmin } from "@/features/admin/queries";

/** Moderation view. Admin read of another user's gift is logged by the action taken, not the view. */
export default async function AdminGiftPage({ params, searchParams }: PageProps<"/admin/gifts/[giftId]">) {
  await requireAdmin();
  const { giftId } = await params;
  const query = await searchParams;
  const t = await getTranslations("admin");
  const format = await getFormatter();
  const data = await getGiftForModeration(giftId);
  if (!data) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={data.gift.title}
        subtitle={t("gift.by", { name: data.senderName })}
        action={
          <div className="flex items-center gap-2">
            <GiftStatusChip status={data.gift.status} opened={false} />
            <Button asChild size="sm" variant="secondary">
              <Link href="/admin/reports">{t("gift.backToReports")}</Link>
            </Button>
          </div>
        }
      />
      <AdminFlash ok={typeof query.ok === "string" ? query.ok : undefined} error={typeof query.error === "string" ? query.error : undefined} />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <GiftView
          sections={data.sections}
          media={data.media}
          variant={data.variant}
          style={data.style}
          recipientName={data.recipientName}
          senderName={data.senderName}
          compact
        />

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("gift.reports", { count: data.reports.length })}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {data.reports.map((r) => (
                <div key={r.id} className="rounded-xl border border-border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone="neutral">{t(`reports.reasons.${r.reason}`)}</Chip>
                    <Chip tone={r.status === "open" ? "primary" : "neutral"}>{t(`reports.status.${r.status}`)}</Chip>
                    <span className="text-xs text-muted-foreground">{format.dateTime(new Date(r.created_at), { dateStyle: "medium" })}</span>
                  </div>
                  {r.details && <p className="mt-2 whitespace-pre-line text-muted-foreground">{r.details}</p>}
                </div>
              ))}
              {data.reports.length === 0 && <p className="text-sm text-muted-foreground">{t("gift.noReports")}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("gift.actions")}</CardTitle>
              <CardDescription>{t("gift.disableHint")}</CardDescription>
            </CardHeader>
            <CardContent>
              {data.gift.status === "published" ? (
                <form action={disableGift} className="flex flex-col gap-2">
                  <input type="hidden" name="giftId" value={data.gift.id} />
                  <Input name="reason" placeholder={t("gift.reasonPlaceholder")} maxLength={300} />
                  <ConfirmButton variant="primary" confirmText={t("gift.disableConfirm")}>
                    {t("gift.disable")}
                  </ConfirmButton>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">{t("gift.notLive")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
