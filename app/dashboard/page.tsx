import { Gift, MessageCircleHeart, Plus, Send, Star } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Lovebirds } from "@/components/brand/lovebirds";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatTile } from "@/components/dashboard/stat-tile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GiftStatusChip } from "@/components/gift/gift-status-chip";
import { listMyGifts } from "@/features/gifts/queries";
import { getCurrentProfile, getDashboardStats } from "@/features/profile/queries";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const profile = await getCurrentProfile();
  const [stats, gifts] = await Promise.all([getDashboardStats(profile.id), listMyGifts()]);
  const recent = gifts.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("welcome", { name: profile.display_name })}
        subtitle={t("welcomeSubtitle")}
        action={
          <Button asChild>
            <Link href="/create">
              <Plus />
              {t("createNewGift")}
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={t("stats.giftsCreated")} value={stats.giftsCreated} icon={Gift} />
        <StatTile label={t("stats.opened")} value={stats.opened} icon={Send} />
        <StatTile label={t("stats.responses")} value={stats.responses} icon={MessageCircleHeart} />
        <StatTile label={t("stats.pointsBalance")} value={profile.points_balance} icon={Star} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle>{t("recentGifts")}</CardTitle>
              {recent.length === 0 && <CardDescription>{t("recentGiftsEmpty")}</CardDescription>}
            </div>
            {gifts.length > 0 && (
              <Button asChild variant="link" size="sm">
                <Link href="/dashboard/gifts">{t("viewAll")}</Link>
              </Button>
            )}
          </CardHeader>
          {recent.length === 0 ? (
            <CardContent className="flex flex-col items-center gap-4 pt-2 text-center">
              <div className="w-full max-w-60">
                <Lovebirds />
              </div>
              <Button asChild variant="soft">
                <Link href="/create">{t("createFirstGift")}</Link>
              </Button>
            </CardContent>
          ) : (
            <CardContent className="flex flex-col gap-2 pt-0">
              {recent.map((gift) => (
                <Link
                  key={gift.id}
                  href={`/dashboard/gifts/${gift.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-secondary/60"
                >
                  <span className="bg-hero grid size-11 shrink-0 place-items-center rounded-lg font-display font-semibold">
                    {gift.title.trim().charAt(0).toUpperCase() || "♥"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{gift.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {gift.recipient?.name ? t("gifts.for", { name: gift.recipient.name }) : t("gifts.noRecipient")}
                    </p>
                  </div>
                  <GiftStatusChip status={gift.status} opened={Boolean(gift.recipient?.first_opened_at)} />
                </Link>
              ))}
            </CardContent>
          )}
        </Card>

        <Card className="bg-hero">
          <CardHeader>
            <CardTitle>{t("points.title")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            <div>
              <p className="font-display text-4xl font-semibold">{profile.points_balance}</p>
              <p className="text-sm text-muted-foreground">{t("points.total")}</p>
            </div>
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex justify-between">
                <span>{t("points.earn.create")}</span>
                <span className="font-semibold text-success">+20</span>
              </li>
              <li className="flex justify-between">
                <span>{t("points.earn.opened")}</span>
                <span className="font-semibold text-success">+10</span>
              </li>
              <li className="flex justify-between">
                <span>{t("points.earn.response")}</span>
                <span className="font-semibold text-success">+20</span>
              </li>
            </ul>
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard/points">{t("points.history")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
