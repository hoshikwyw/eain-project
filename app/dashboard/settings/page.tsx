import { ChevronDown, LogOut, Trash2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { DeleteAccountForm } from "@/components/dashboard/delete-account-form";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { SettingsGroup } from "@/components/dashboard/settings-group";
import { SubmitButton } from "@/components/ui/submit-button";
import { signOut } from "@/features/auth/actions";
import { getCurrentProfile } from "@/features/profile/queries";
import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/ui/page-title";
import { initialOf } from "@/lib/utils";
import { PointsPill } from "@/components/dashboard/points-pill";

/** An action in the account group: icon and label, full width, left aligned. */
const ACTION = "h-12 w-full justify-start gap-3 rounded-2xl px-3";

/**
 * Settings, laid out like a phone's settings app: who is signed in on top,
 * then short groups of options, then the account actions with deleting the
 * account folded away at the very end.
 */
export default async function SettingsPage() {
  const t = await getTranslations("dashboard.settings");
  const tNav = await getTranslations("dashboard.nav");
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? "";
  const isAdmin = profile.role === "admin";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageTitle>{t("title")}</PageTitle>

      {/* Who is signed in */}
      <section className="bg-hero flex items-center gap-4 rounded-4xl px-5 py-6 sm:gap-6 sm:px-8 sm:py-7">
        <span
          aria-hidden="true"
          className="grid size-16 shrink-0 place-items-center rounded-full bg-background/70 font-display text-3xl font-semibold ring-4 ring-background/40 sm:size-20 sm:text-4xl"
        >
          {initialOf(profile.display_name)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col items-start">
          <p className="max-w-full truncate font-display text-2xl font-semibold">{profile.display_name}</p>
          <p className="max-w-full truncate text-sm text-muted-foreground">{email}</p>
          <PointsPill balance={profile.points_balance} label={tNav("points")} tone="plain" className="mt-2.5" />
        </div>
      </section>

      <ProfileForm profile={profile} />

      <SettingsGroup title={t("account")} className="flex flex-col gap-1 p-1.5">
        <form action={signOut}>
          <SubmitButton variant="ghost" className={ACTION}>
            <LogOut />
            {t("signOut")}
          </SubmitButton>
        </form>
        <details className="group border-t border-border pt-1">
          <summary className="flex h-12 cursor-pointer list-none items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-destructive transition-colors outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/60 [&::-webkit-details-marker]:hidden">
            <Trash2 className="size-4" />
            {t("deleteTitle")}
            <ChevronDown className="ml-auto size-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="flex flex-col gap-4 px-3 pt-2 pb-3">
            <p className="text-sm text-muted-foreground">{isAdmin ? t("deleteAdminHint") : t("deleteHint")}</p>
            {!isAdmin && <DeleteAccountForm email={email} />}
          </div>
        </details>
      </SettingsGroup>
    </div>
  );
}
