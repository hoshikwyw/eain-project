import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { isSupabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/auth/paths";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("logIn") };
}

export default async function LoginPage({ searchParams }: PageProps<"/auth/login">) {
  const t = await getTranslations("auth");
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  const notice = typeof params.notice === "string" ? params.notice : undefined;

  return (
    <AuthShell title={t("welcomeBack")} subtitle={t("loginSubtitle")}>
      <AuthForm mode="login" next={next} notice={notice} configured={isSupabaseConfigured()} />
    </AuthShell>
  );
}
