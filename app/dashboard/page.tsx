import { ArrowRight, Bell, Gift, Lock, MailOpen, MessageCircleHeart, Plus, ShieldAlert, Star, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Bird, Lovebirds } from "@/components/brand/lovebirds";
import { StartTemplateButton } from "@/components/dashboard/start-template";
import { GiftStatusChip } from "@/components/gift/gift-status-chip";
import { GiftThumb } from "@/components/gift/gift-thumb";
import { TemplatePreview } from "@/components/templates/template-preview";
import { Button } from "@/components/ui/button";
import { createGift } from "@/features/gifts/actions";
import { listMyGiftCards } from "@/features/gifts/queries";
import { loadTemplateCards } from "@/features/gifts/template-cards";
import { isAvailableTemplate } from "@/features/gifts/templates";
import { getCurrentProfile, getDashboardStats } from "@/features/profile/queries";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

/** How many of each thing the home screen shows before "see all". */
const GIFTS_SHOWN = 4;
const TEMPLATES_SHOWN = 8;
const ACTIVITY_SHOWN = 4;

const ACTIVITY: Record<string, { key: "giftOpened" | "responseReceived" | "giftDisabled"; icon: LucideIcon }> = {
  giftOpened: { key: "giftOpened", icon: MailOpen },
  responseReceived: { key: "responseReceived", icon: MessageCircleHeart },
  giftDisabled: { key: "giftDisabled", icon: ShieldAlert },
};

/** A section's title, a line under it, and an optional "see all" link on the right. */
function SectionHeading({ title, hint, href, linkLabel }: { title: string; hint?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold sm:text-2xl">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
      </div>
      {href && linkLabel && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary underline-offset-4 hover:underline">
          {linkLabel}
          <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

/**
 * The home screen. It opens with an invitation to make something, then
 * shows the creator's gifts as pictures, templates to start from, and what
 * has happened lately. Numbers are a small line under the greeting, not the
 * headline: this is a place to make gifts, not to read a report.
 */
export default async function HomePage({ searchParams }: PageProps<"/dashboard">) {
  const notice = (await searchParams).notice;
  const t = await getTranslations("dashboard");
  const format = await getFormatter();
  const locale = (await getLocale()) === "my" ? "my" : "en";
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [stats, cards, { templates }, { data: notifications }] = await Promise.all([
    getDashboardStats(profile.id),
    listMyGiftCards(GIFTS_SHOWN),
    loadTemplateCards(locale),
    supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(ACTIVITY_SHOWN),
  ]);
  const shelf = templates.filter((tp) => isAvailableTemplate(tp.slug)).slice(0, TEMPLATES_SHOWN);
  const activity = notifications ?? [];

  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      {notice === "passwordUpdated" && (
        <p role="status" className="rounded-xl bg-success-soft px-3.5 py-2.5 text-sm text-success">
          {t("passwordUpdated")}
        </p>
      )}

      {/* Greeting */}
      <section className="bg-hero relative flex flex-col-reverse items-center gap-2 overflow-hidden rounded-[2rem] px-6 py-8 sm:flex-row sm:gap-8 sm:px-10 sm:py-10">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-4 text-center sm:items-start sm:text-left">
          <h1 className="font-display text-3xl font-semibold text-balance sm:text-4xl lg:text-5xl">{t("welcome", { name: profile.display_name })}</h1>
          <p className="max-w-md text-muted-foreground sm:text-lg">{t("welcomeSubtitle")}</p>
          <Button asChild size="lg" className="rounded-full">
            <Link href="/create">
              <Plus />
              {t("createNewGift")}
            </Link>
          </Button>
          <ul className="flex flex-wrap justify-center gap-2 pt-1 text-sm font-semibold sm:justify-start">
            {(
              [
                [Gift, t("home.statGifts", { count: stats.giftsCreated })],
                [MailOpen, t("home.statOpened", { count: stats.opened })],
                [MessageCircleHeart, t("home.statReplies", { count: stats.responses })],
              ] as const
            ).map(([Icon, label]) => (
              <li key={label} className="inline-flex items-center gap-1.5 rounded-full bg-background/60 px-3 py-1 text-muted-foreground">
                <Icon className="size-4" />
                {label}
              </li>
            ))}
          </ul>
        </div>
        <div className="w-32 shrink-0 sm:w-56 lg:w-72">
          <Lovebirds eager />
        </div>
      </section>

      {/* The creator's gifts, as pictures */}
      <section className="flex flex-col gap-4">
        <SectionHeading
          title={t("home.yourGifts")}
          hint={cards.length > 0 ? t("home.yourGiftsHint") : undefined}
          href={cards.length > 0 ? "/dashboard/gifts" : undefined}
          linkLabel={t("viewAll")}
        />
        {cards.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border px-6 py-10 text-center">
            <Bird variant="pink" className="w-20" />
            <div>
              <p className="font-display text-lg font-semibold">{t("home.emptyTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("recentGiftsEmpty")}</p>
            </div>
            <Button asChild variant="soft" className="rounded-full">
              <Link href="/create">{t("createFirstGift")}</Link>
            </Button>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-4 md:grid-cols-4">
            {cards.map((card) => {
              const { gift, recipient } = card;
              // A draft goes back into the editor; a shared gift goes to its page.
              const href = gift.status === "draft" ? `/create/${gift.id}` : `/dashboard/gifts/${gift.id}`;
              return (
                <li key={gift.id}>
                  <Link href={href} className="group flex flex-col gap-2.5 rounded-2xl outline-none">
                    <GiftThumb
                      card={card}
                      senderName={profile.display_name}
                      className="shadow-soft ring-1 ring-border transition-transform duration-200 group-hover:-translate-y-1 group-focus-visible:-translate-y-1 group-focus-visible:ring-2 group-focus-visible:ring-ring"
                    />
                    <div className="min-w-0 px-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold">{gift.title}</p>
                        <GiftStatusChip status={gift.status} opened={Boolean(recipient?.first_opened_at)} />
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {recipient?.name ? t("gifts.for", { name: recipient.name }) : t("gifts.noRecipient")}
                        {" · "}
                        {format.relativeTime(new Date(gift.updated_at))}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Templates to start from */}
      {shelf.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeading title={t("home.startNew")} hint={t("home.startNewHint")} href="/create" linkLabel={t("home.allTemplates")} />
          {/* One row that scrolls sideways; it bleeds to the screen edge on phones. */}
          <ul className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pt-1 pb-2 scrollbar-thin sm:gap-4">
            {shelf.map((tp) => {
              const card = (
                <>
                  <TemplatePreview slug={tp.slug} variant={tp.variant} locale={locale} name={tp.name} />
                  <span className="mt-2.5 flex items-center justify-between gap-2 px-1">
                    <span className="truncate text-sm font-semibold">{tp.name}</span>
                    {tp.isPremium && !tp.unlocked ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-accent-foreground dark:text-brand">
                        <Lock className="size-3" />
                        {tp.pointPrice}
                      </span>
                    ) : (
                      !tp.isPremium && <span className="shrink-0 text-xs font-semibold text-success">{t("home.free")}</span>
                    )}
                  </span>
                </>
              );
              const cardClass = "block w-52 rounded-2xl outline-none transition-transform duration-200 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-ring sm:w-60";
              return (
                <li key={tp.id} className="shrink-0 snap-start">
                  {tp.available ? (
                    <form action={createGift}>
                      <input type="hidden" name="template" value={tp.slug} />
                      <StartTemplateButton className={cardClass}>{card}</StartTemplateButton>
                    </form>
                  ) : (
                    // Locked: the picker is where it can be unlocked with points.
                    <Link href="/create" className={cardClass}>
                      {card}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        {/* What happened lately */}
        <section className="flex flex-col gap-4">
          <SectionHeading
            title={t("home.lately")}
            href={activity.length > 0 ? "/dashboard/notifications" : undefined}
            linkLabel={t("viewAll")}
          />
          {activity.length === 0 ? (
            <p className="rounded-3xl bg-secondary/60 px-5 py-6 text-sm text-muted-foreground">{t("home.latelyEmpty")}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {activity.map((n) => {
                const kind = ACTIVITY[n.title_key];
                const Icon = kind?.icon ?? Bell;
                const payload = (n.payload ?? {}) as { giftTitle?: string };
                const row = (
                  <span className="flex items-center gap-3.5 rounded-2xl px-3 py-3 transition-colors hover:bg-secondary/60">
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", n.read_at ? "bg-secondary text-muted-foreground" : "bg-brand-soft text-accent-foreground dark:text-brand")}>
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-sm", !n.read_at && "font-semibold")}>
                        {t(`notifications.titles.${kind?.key ?? "generic"}`, { giftTitle: payload.giftTitle ?? "" })}
                      </span>
                      <span className="block text-xs text-muted-foreground">{format.relativeTime(new Date(n.created_at))}</span>
                    </span>
                    {!n.read_at && <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-brand" />}
                  </span>
                );
                return (
                  <li key={n.id}>
                    {n.gift_id ? (
                      <Link href={`/dashboard/gifts/${n.gift_id}`} className="block rounded-2xl">
                        {row}
                      </Link>
                    ) : (
                      row
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Points */}
        <section className="bg-hero flex flex-col gap-4 self-start rounded-3xl p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">{t("points.total")}</p>
              <p className="flex items-center gap-2 font-display text-4xl font-semibold">
                <Star className="size-7 fill-current text-brand" />
                {profile.points_balance}
              </p>
            </div>
            <Bird variant="blue" className="w-16" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase my:tracking-normal my:normal-case">{t("home.waysToEarn")}</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm">
              {(
                [
                  [t("points.earn.create"), 5],
                  [t("points.earn.opened"), 10],
                  [t("points.earn.response"), 20],
                ] as const
              ).map(([label, amount]) => (
                <li key={label} className="flex items-center justify-between gap-3 rounded-xl bg-background/60 px-3 py-2">
                  <span>{label}</span>
                  <span className="font-bold text-success">+{amount}</span>
                </li>
              ))}
            </ul>
          </div>
          <Button asChild variant="secondary" size="sm" className="rounded-full">
            <Link href="/dashboard/points">{t("points.history")}</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
