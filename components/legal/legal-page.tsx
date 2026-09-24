import { Check } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import type { LegalDoc } from "@/content/legal";

const related = [
  { key: "privacy", href: "/privacy" },
  { key: "terms", href: "/terms" },
  { key: "security", href: "/security" },
  { key: "cookies", href: "/cookies" },
] as const;

/** Plain summary first, then the full text. Marked as draft until legal review. */
export async function LegalPage({ doc, current }: { doc: LegalDoc; current: (typeof related)[number]["key"] }) {
  const t = await getTranslations("legal");
  const format = await getFormatter();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-4xl font-semibold">{doc.title}</h1>
        <p className="text-lg text-muted-foreground">{doc.intro}</p>
        <p className="text-xs text-muted-foreground">
          {t("updated", { date: format.dateTime(new Date(doc.updated), { dateStyle: "long" }) })}
        </p>
        <p className="rounded-xl bg-accent px-3.5 py-2.5 text-sm text-accent-foreground">{t("draftNotice")}</p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="mb-4 font-display text-xl font-semibold">{t("summary")}</h2>
        <ul className="flex flex-col gap-3">
          {doc.summary.map((line, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                <Check className="size-3" />
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <article className="flex flex-col gap-8">
        <h2 className="font-display text-2xl font-semibold">{t("fullText")}</h2>
        {doc.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold">{section.heading}</h3>
            {section.body.map((p, i) => (
              <p key={i} className="text-[15px] leading-relaxed text-foreground/85">
                {p}
              </p>
            ))}
          </section>
        ))}
      </article>

      <nav aria-label={t("related")} className="flex flex-wrap gap-2 border-t border-border pt-6 text-sm">
        {related
          .filter((r) => r.key !== current)
          .map((r) => (
            <Link key={r.key} href={r.href} className="rounded-full border border-border px-3.5 py-1.5 font-semibold text-muted-foreground hover:text-foreground">
              {t(`links.${r.key}`)}
            </Link>
          ))}
        <Link href="/contact" className="rounded-full border border-border px-3.5 py-1.5 font-semibold text-muted-foreground hover:text-foreground">
          {t("links.contact")}
        </Link>
      </nav>
    </div>
  );
}
