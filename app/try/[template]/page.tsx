import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ContinueDraft } from "@/components/editor/continue-draft";
import { GuestEditor } from "@/components/editor/guest-editor";
import { openingFromTheme, sceneFromTheme, variantFromTheme } from "@/features/gifts/sections";
import {
  defaultTheme,
  getTemplateStyle,
  isAvailableTemplate,
  templates,
} from "@/features/gifts/templates";
import { track } from "@/lib/analytics";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

type Props = PageProps<"/try/[template]">;

async function loadTemplate(slug: string) {
  if (!isAvailableTemplate(slug)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("templates")
    .select("name_en, name_my, is_premium")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { template: slug } = await params;
  const template = await loadTemplate(slug);
  if (!template) return {};
  const t = await getTranslations("editor.guest");
  const locale = await getLocale();
  return {
    title: t("pageTitle", { name: locale === "my" ? template.name_my : template.name_en }),
    robots: { index: false, follow: false },
  };
}

/**
 * A template open in the real editor for someone without an account. The
 * gift is kept in their browser; an account is asked for when they want to
 * save or publish it. A signed-in creator gets a saved gift instead: made
 * from their draft of this template if the browser holds one, fresh if not.
 * A premium template is unlocked with points, so it needs an account first.
 */
export default async function TryTemplatePage({ params }: Props) {
  const { template: slug } = await params;
  const template = await loadTemplate(slug);
  if (!template) notFound();
  if (await getCurrentUser()) return <ContinueDraft template={slug} />;
  if (template.is_premium) redirect(`/create?template=${slug}`);

  const locale = (await getLocale()) === "my" ? "my" : "en";
  await track("template_tried", null, { template: slug, locale });
  const style = getTemplateStyle(slug);
  const theme = defaultTheme(slug);
  const scene = sceneFromTheme(theme);

  return (
    <GuestEditor
      template={slug}
      style={style}
      start={{
        title: locale === "my" ? template.name_my : template.name_en,
        recipientName: "",
        variant: variantFromTheme(theme),
        opening: openingFromTheme(theme, style.defaultOpening),
        colors: {},
        stickers: [],
        ...(scene && { scene }),
        sections: templates[slug]!.defaultSections(locale),
      }}
    />
  );
}
