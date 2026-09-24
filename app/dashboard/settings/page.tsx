import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { signOut } from "@/features/auth/actions";
import { getCurrentProfile } from "@/features/profile/queries";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const t = await getTranslations("dashboard.settings");
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} subtitle={user?.email ?? ""} />

      <Card>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
          <CardDescription>{t("profileDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("account")}</CardTitle>
          <CardDescription>{t("deleteSoon")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signOut}>
            <SubmitButton variant="secondary">{t("signOut")}</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
