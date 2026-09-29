import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { appMode } from "@/lib/app-mode";
import { getAuthProviders } from "@/lib/auth/providers";
import { isSupabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/auth/paths";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: appMode === "admin" ? t("adminTitle") : t("logIn") };
}

export default async function LoginPage({ searchParams }: PageProps<"/auth/login">) {
  const t = await getTranslations("auth");
  const params = await searchParams;
  const isAdminSite = appMode === "admin";
  const requested = typeof params.next === "string" ? params.next : null;
  const next = requested ? safeNextPath(requested) : isAdminSite ? "/admin" : safeNextPath(null);
  const notice = typeof params.notice === "string" ? params.notice : undefined;
  const providers = await getAuthProviders();

  return (
    <AuthShell
      title={isAdminSite ? t("adminTitle") : t("welcomeBack")}
      subtitle={isAdminSite ? t("adminSubtitle") : t("loginSubtitle")}
    >
      <AuthForm
        mode="login"
        next={next}
        notice={notice}
        configured={isSupabaseConfigured()}
        googleEnabled={providers.google}
        allowSignup={!isAdminSite}
      />
    </AuthShell>
  );
}
