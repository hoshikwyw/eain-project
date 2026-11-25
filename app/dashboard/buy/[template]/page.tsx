import { ArrowLeft, MessageCircle, Send, Smartphone, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { PageTitle } from "@/components/ui/page-title";
import { getCurrentProfile } from "@/features/profile/queries";
import { createClientWithUser } from "@/lib/supabase/server";

/**
 * Where payment goes, from the server environment so the numbers can change
 * without a code change. Any of them may be missing; with none, the page says
 * buying opens soon.
 */
function paymentDetails() {
  const clean = (v: string | undefined) => (v && v.trim() ? v.trim() : null);
  const contact = clean(process.env.EAIN_SALES_CONTACT_URL);
  const email = clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL);
  return {
    name: clean(process.env.EAIN_PAY_NAME),
    wallets: [
      { label: "KBZPay", number: clean(process.env.EAIN_PAY_KBZPAY) },
      { label: "WavePay", number: clean(process.env.EAIN_PAY_WAVEPAY) },
    ].filter((w): w is { label: string; number: string } => Boolean(w.number)),
    // Only a web link is used as the contact button: Messenger, Viber or Telegram.
    contactUrl: contact && /^https:\/\//.test(contact) ? contact : null,
    email,
  };
}

/**
 * How to buy a paid-only template: pay by mobile wallet, send the
 * screenshot with the account email, and Eain grants it from the admin
 * console (admin_grant_template). Points never unlock these templates.
 */
export default async function BuyTemplatePage({ params }: PageProps<"/dashboard/buy/[template]">) {
  const { template: slug } = await params;
  const t = await getTranslations("buy");
  const tCreate = await getTranslations("create");
  const locale = await getLocale();
  const profile = await getCurrentProfile();
  const { supabase, user } = await createClientWithUser();

  const { data: template } = await supabase
    .from("templates")
    .select("id, slug, name_en, name_my, is_premium, paid_only, price_mmk")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!template || !template.is_premium) notFound();
  if (!template.paid_only) redirect(`/create?template=${slug}`);

  const { data: owned } = await supabase
    .from("template_unlocks")
    .select("template_id")
    .eq("user_id", profile.id)
    .eq("template_id", template.id)
    .maybeSingle();
  if (owned) redirect(`/create?template=${slug}`);

  const name = locale === "my" ? template.name_my : template.name_en;
  const price = template.price_mmk;
  const pay = paymentDetails();
  const ready = pay.wallets.length > 0 && (pay.contactUrl || pay.email);
  const accountEmail = user?.email ?? "";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/create">
            <ArrowLeft />
            {t("back")}
          </Link>
        </Button>
        <PageTitle className="mt-2">{t("title", { name })}</PageTitle>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {price ? (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <span className="text-sm text-muted-foreground">{t("price")}</span>
            <span className="font-display text-2xl font-semibold">
              {tCreate("priceKs", { price })}
            </span>
          </CardContent>
        </Card>
      ) : null}

      {!ready ? (
        <Notice>{t("soon")}</Notice>
      ) : (
        <ol className="flex flex-col gap-4">
          <Step n={1} icon={Smartphone} title={t("step1Title", { price: price ?? 0 })}>
            <ul className="flex flex-col gap-2">
              {pay.wallets.map((w) => (
                <li
                  key={w.label}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-secondary px-4 py-3"
                >
                  <span className="text-sm font-semibold">{w.label}</span>
                  <span className="font-mono text-base tracking-wide select-all">{w.number}</span>
                </li>
              ))}
            </ul>
            {pay.name && (
              <p className="mt-2 text-sm text-muted-foreground">
                {t("accountName", { name: pay.name })}
              </p>
            )}
          </Step>

          <Step n={2} icon={Send} title={t("step2Title")}>
            <p className="text-sm text-muted-foreground">{t("step2Text")}</p>
            <p className="mt-2 rounded-xl bg-secondary px-4 py-3 text-sm">
              <span className="text-muted-foreground">{t("yourEmail")} </span>
              <span className="font-semibold break-all select-all">{accountEmail}</span>
              <br />
              <span className="text-muted-foreground">{t("template")} </span>
              <span className="font-semibold">{name}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pay.contactUrl && (
                <Button asChild>
                  <a href={pay.contactUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle />
                    {t("message")}
                  </a>
                </Button>
              )}
              {pay.email && (
                <Button asChild variant="secondary">
                  <a
                    href={`mailto:${pay.email}?subject=${encodeURIComponent(`Eain: ${template.name_en}`)}&body=${encodeURIComponent(`${accountEmail}\n${template.slug}`)}`}
                  >
                    {t("email")}
                  </a>
                </Button>
              )}
            </div>
          </Step>

          <Step n={3} icon={Sparkles} title={t("step3Title")}>
            <p className="text-sm text-muted-foreground">{t("step3Text")}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("refund")}{" "}
              <Link
                href="/terms"
                className="font-semibold text-foreground underline underline-offset-4"
              >
                {t("terms")}
              </Link>
            </p>
          </Step>
        </ol>
      )}
    </div>
  );
}

function Step({
  n,
  icon: Icon,
  title,
  children,
}: {
  n: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Card>
        <CardContent className="flex gap-4 p-5">
          <span
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"
            aria-hidden
          >
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">
              <span className="sr-only">{n}. </span>
              {title}
            </h2>
            <div className="mt-2">{children}</div>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
