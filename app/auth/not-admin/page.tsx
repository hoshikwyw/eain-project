import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { signOut } from "@/features/auth/actions";
import { userHref } from "@/lib/app-mode";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.notAdmin");
  return { title: t("title"), robots: { index: false, follow: false } };
}

/** Shown on the admin site to signed-in accounts without the admin role. */
export default async function NotAdminPage() {
  const t = await getTranslations("auth.notAdmin");
  return (
    <AuthShell title={t("title")} subtitle={t("text")}>
      <div className="flex flex-col gap-3">
        <form action={signOut}>
          <SubmitButton className="w-full">{t("switch")}</SubmitButton>
        </form>
        <Button asChild variant="secondary" className="w-full">
          <a href={userHref("/dashboard")}>{t("toUserSite")}</a>
        </Button>
      </div>
    </AuthShell>
  );
}
