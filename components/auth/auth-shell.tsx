import { Star } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { Lovebirds } from "@/components/brand/lovebirds";
import { LocaleToggle } from "@/components/settings/locale-toggle";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { appMode } from "@/lib/app-mode";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle: string;
  /** The subtitle is a reward (the welcome points): show it as a highlighted pill. */
  reward?: boolean;
  /** A sentence on what the account is for, shown under the title. */
  intro?: string;
  children: React.ReactNode;
};

/**
 * The frame around the sign-in, sign-up and password screens. On wide
 * screens the lovebirds and the promise of the product sit on the left and
 * the form on the right; on phones the birds sit above the form. The admin
 * site keeps a plain centred card, since it is a tool and not a welcome.
 */
export async function AuthShell({ title, subtitle, reward, intro, children }: Props) {
  const t = await getTranslations("home");
  const branded = appMode !== "admin";

  return (
    <main className="bg-hero relative flex flex-1 flex-col lg:flex-row">
      {branded && (
        <aside className="hidden flex-1 flex-col items-center justify-center gap-8 p-12 text-center lg:flex">
          <Link href="/" aria-label="Eain" className="absolute top-5 left-8 rounded-lg">
            <Logo />
          </Link>
          <div className="w-full max-w-xs xl:max-w-sm">
            <Lovebirds eager />
          </div>
          <div className="max-w-md">
            <p className="font-display text-4xl leading-tight font-light text-balance xl:text-5xl my:text-3xl my:leading-[1.5] my:text-wrap">
              {t.rich("headline", {
                em: (chunks) => (
                  <em className="font-normal text-primary-ink italic my:not-italic">{chunks}</em>
                ),
              })}
            </p>
            <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
          </div>
          <p className="text-sm text-muted-foreground">{t("meta")}</p>
        </aside>
      )}

      <div
        className={cn(
          "flex flex-1 flex-col",
          branded && "lg:rounded-l-[2.5rem] lg:bg-background/80",
        )}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 lg:px-8">
          <Link href="/" aria-label="Eain" className={cn("rounded-lg", branded && "lg:invisible")}>
            <Logo />
          </Link>
          <div className="flex items-center gap-1.5">
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-start justify-center px-4 pt-2 pb-16 sm:items-center">
          <div className="w-full max-w-md">
            {branded && (
              <div className="mx-auto mb-4 w-28 lg:hidden">
                <Lovebirds eager />
              </div>
            )}
            <div
              className={cn(
                "flex flex-col gap-6 rounded-3xl border glass p-6 shadow-soft sm:p-8",
                branded && "lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none",
              )}
            >
              <div
                className={cn(
                  "flex flex-col items-center gap-2 text-center",
                  branded && "lg:items-start lg:text-left",
                )}
              >
                <h1 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
                {reward ? (
                  <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-accent-foreground dark:text-brand">
                    <Star className="size-4 shrink-0 fill-current" />
                    {subtitle}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
                {intro && (
                  <p className="mt-1 text-sm text-balance text-muted-foreground">{intro}</p>
                )}
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
