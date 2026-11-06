import { CreditCard, Gift, LockOpen, MailOpen, MessageCircleHeart, Sparkles, Star, Undo2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Bird } from "@/components/brand/lovebirds";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/features/profile/queries";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { PointTransactionType } from "@/types/database";

/** What earns points, and how many. The amounts are set by the database rules. */
const WAYS_TO_EARN = [
  { key: "create", amount: 5, icon: Gift },
  { key: "opened", amount: 10, icon: MailOpen },
  { key: "response", amount: 20, icon: MessageCircleHeart },
] as const;

const TYPE_ICON: Record<PointTransactionType, LucideIcon> = {
  earn: Star,
  bonus: Sparkles,
  purchase: CreditCard,
  spend: LockOpen,
  refund: Undo2,
};

/**
 * Points as a wallet: the balance up front, then how to earn more, then
 * every time points came in or went out.
 */
export default async function PointsPage() {
  const t = await getTranslations("dashboard");
  const format = await getFormatter();
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  // Filtered to the owner on purpose: an admin may read everyone's rows, and this is a personal page.
  const { data } = await supabase
    .from("point_transactions")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const transactions = data ?? [];

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">{t("points.title")}</h1>

      {/* The wallet */}
      <section className="bg-hero relative flex items-center gap-4 overflow-hidden rounded-4xl px-6 py-8 sm:gap-8 sm:px-10 sm:py-10">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <p className="text-sm font-semibold text-muted-foreground">{t("points.total")}</p>
          <p className="flex items-center gap-3 font-display text-6xl font-semibold tabular-nums sm:text-7xl">
            <Star className="size-10 shrink-0 fill-current text-brand sm:size-12" />
            {profile.points_balance}
          </p>
          <p className="mt-2 max-w-md text-muted-foreground">{t("points.subtitle")}</p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/create">{t("points.spend")}</Link>
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">{t("points.buySoon")}</p>
        </div>
        <Bird variant="blue" className="w-24 shrink-0 sm:w-44" />
      </section>

      {/* Ways to earn */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold sm:text-2xl">{t("home.waysToEarn")}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("points.dailyCap")}</p>
        </div>
        <ul className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {WAYS_TO_EARN.map(({ key, amount, icon: Icon }) => (
            <li key={key} className="flex flex-col items-center gap-2 rounded-3xl border border-border bg-card px-2 py-5 text-center shadow-soft sm:flex-row sm:gap-4 sm:px-5 sm:text-left">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-accent-foreground sm:size-12 dark:text-brand">
                <Icon className="size-5 sm:size-6" />
              </span>
              <span className="min-w-0 sm:flex-1">
                <span className="block font-display text-2xl font-semibold text-success">+{amount}</span>
                <span className="block text-xs text-muted-foreground sm:text-sm">{t(`points.earn.${key}`)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Every time points moved */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold sm:text-2xl">{t("points.history")}</h2>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border px-6 py-10 text-center">
            <Bird variant="pink" className="w-16" />
            <p className="text-sm text-muted-foreground">{t("points.empty")}</p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-3xl border border-border bg-card px-2 shadow-soft sm:px-3">
            {transactions.map((tx) => {
              const Icon = TYPE_ICON[tx.type] ?? Star;
              const gained = tx.amount > 0;
              return (
                <li key={tx.id} className="flex items-center gap-3.5 px-2 py-3.5">
                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", gained ? "bg-success-soft text-success" : "bg-secondary text-muted-foreground")}>
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{tx.description || t(`points.types.${tx.type}`)}</p>
                    <p className="text-xs text-muted-foreground">{format.dateTime(new Date(tx.created_at), { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                  <span className={cn("shrink-0 font-display text-lg font-semibold tabular-nums", gained ? "text-success" : "text-muted-foreground")}>
                    {gained ? `+${tx.amount}` : tx.amount}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
