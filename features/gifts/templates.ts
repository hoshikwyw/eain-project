import type { SectionType } from "@/types/database";
import type { GiftTheme } from "./schemas";

/**
 * Code-side template registry. The database holds template metadata (name,
 * price, category); the layout lives here as React components keyed by slug.
 * Only slugs listed here can be used to create a gift.
 */
export const AVAILABLE_TEMPLATE_SLUGS = ["birthday-postcard"] as const;
export type AvailableTemplateSlug = (typeof AVAILABLE_TEMPLATE_SLUGS)[number];

export function isAvailableTemplate(slug: string): slug is AvailableTemplateSlug {
  return (AVAILABLE_TEMPLATE_SLUGS as readonly string[]).includes(slug);
}

type DefaultSection = { type: SectionType; position: number; content: Record<string, string> };

type TemplateDefaults = {
  theme: GiftTheme;
  sections: (locale: "en" | "my") => DefaultSection[];
};

export const templateDefaults: Record<AvailableTemplateSlug, TemplateDefaults> = {
  "birthday-postcard": {
    theme: { variant: "blossom" },
    sections: (locale): DefaultSection[] => [
      {
        type: "text",
        position: 0,
        content: { heading: locale === "my" ? "မွေးနေ့ပျော်ရွှင်ပါစေ" : "Happy Birthday!" },
      },
      {
        type: "message",
        position: 1,
        content: {
          text:
            locale === "my"
              ? "သင်ရှိနေတာ ကမ္ဘာကြီးကို ပိုလှပစေပါတယ်။ ဒီနေ့ဟာ သင့်အတွက် အထူးပျော်ရွှင်ဖွယ် ဖြစ်ပါစေ။"
              : "You make the world a better place. I hope today feels as special as you are.",
        },
      },
      {
        type: "final_message",
        position: 2,
        content: { text: locale === "my" ? "မေတ္တာဖြင့်" : "With love,", signature: "" },
      },
    ],
  },
};
