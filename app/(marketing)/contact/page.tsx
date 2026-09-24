import type { Metadata } from "next";
import { Flag, Mail, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Bird } from "@/components/brand/lovebirds";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contact");
  return { title: t("title"), description: t("subtitle") };
}

export default async function ContactPage() {
  const t = await getTranslations("contact");
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-12 md:grid-cols-[1fr_280px] md:items-start">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-4xl font-semibold">{t("title")}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{t("subtitle")}</p>
        </div>

        <Card>
          <CardContent className="flex items-start gap-4 p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Mail className="size-5" />
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="font-semibold">{t("emailTitle")}</h2>
              {email ? (
                <>
                  <p className="text-sm text-muted-foreground">{t("emailText")}</p>
                  <Button asChild className="self-start">
                    <a href={`mailto:${email}`}>{email}</a>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t("emailSoon")}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-4 p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Flag className="size-5" />
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="font-semibold">{t("reportTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("reportText")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-4 p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
              <ShieldAlert className="size-5" />
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="font-semibold">{t("securityTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("securityText")}</p>
              <Button asChild variant="secondary" size="sm" className="self-start">
                <Link href="/security">{t("securityLink")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mx-auto w-full max-w-60 md:mt-10">
        <Bird variant="blue" className="float-slow" />
      </div>
    </div>
  );
}
