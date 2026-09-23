import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { isSupabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/auth/paths";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("signUp") };
}

export default async function SignupPage({ searchParams }: PageProps<"/auth/signup">) {
  const t = await getTranslations("auth");
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);

  return (
    <AuthShell title={t("createAccount")} subtitle={t("signupSubtitle")}>
      <AuthForm mode="signup" next={next} configured={isSupabaseConfigured()} />
    </AuthShell>
  );
}
