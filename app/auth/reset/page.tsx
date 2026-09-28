import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/reset-form";
import { getCurrentUser } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.reset");
  return { title: t("title") };
}

/** Reached from the emailed link after /auth/callback created a session. */
export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/forgot?notice=expired");
  const t = await getTranslations("auth.reset");
  return (
    <AuthShell title={t("title")} subtitle={t("subtitle", { email: user.email ?? "" })}>
      <ResetForm />
    </AuthShell>
  );
}
