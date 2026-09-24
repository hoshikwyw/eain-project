import type { GiftTheme, Section, ThemeVariant } from "./schemas";

/**
 * Code-side template registry. The database holds template metadata (name,
 * price, category); how a template looks lives here. All templates share one
 * section renderer and differ by decoration, layout, default look and the
 * sections they start with.
 */
export type Decoration = "petals" | "stars" | "confetti" | "hearts" | "sparkles" | "leaves";

/** card: one framed card. scroll: each section is its own card, revealed as you scroll. */
export type Layout = "card" | "scroll";

export type TemplateStyle = {
  decoration: Decoration;
  layout: Layout;
  defaultVariant: ThemeVariant;
  /** Composed scene for this template, from scripts/compose-illustrations.mjs. */
  illustration: string;
};

const illustrationFor = (slug: string) => `/brand/illustrations/${slug}.webp`;

type Locale = "en" | "my";

export type TemplateDefinition = Omit<TemplateStyle, "illustration"> & {
  defaultSections: (locale: Locale) => Section[];
};

const my = (locale: Locale, en: string, mm: string) => (locale === "my" ? mm : en);

let seed = 0;
const sid = () => `s${++seed}-${Math.random().toString(36).slice(2, 8)}`;

const cover = (heading: string, subheading = ""): Section => ({
  id: sid(),
  type: "text",
  content: { heading, subheading },
});
const message = (text: string): Section => ({ id: sid(), type: "message", content: { text } });
const image = (caption = ""): Section => ({ id: sid(), type: "image", content: { mediaId: null, caption } });
const grid = (caption = ""): Section => ({ id: sid(), type: "photo_grid", content: { mediaIds: [], caption } });
const quote = (text: string, attribution = ""): Section => ({ id: sid(), type: "quote", content: { text, attribution } });
const final = (text: string, signature = ""): Section => ({
  id: sid(),
  type: "final_message",
  content: { text, signature },
});
const timeline = (items: { date: string; title: string; text: string }[]): Section => ({
  id: sid(),
  type: "timeline",
  content: { items },
});

export const templates: Record<string, TemplateDefinition> = {
  "birthday-postcard": {
    decoration: "petals",
    layout: "card",
    defaultVariant: "blossom",
    defaultSections: (l) => [
      cover(my(l, "Happy Birthday!", "မွေးနေ့ပျော်ရွှင်ပါစေ")),
      message(
        my(
          l,
          "You make the world a better place. I hope today feels as special as you are.",
          "သင်ရှိနေတာ ကမ္ဘာကြီးကို ပိုလှပစေပါတယ်။ ဒီနေ့ဟာ သင့်အတွက် အထူးပျော်ရွှင်ဖွယ် ဖြစ်ပါစေ။",
        ),
      ),
      final(my(l, "With love,", "မေတ္တာဖြင့်")),
    ],
  },
  "birthday-surprise": {
    decoration: "confetti",
    layout: "scroll",
    defaultVariant: "sunset",
    defaultSections: (l) => [
      cover(my(l, "Surprise!", "အံ့အားသင့်စရာ!"), my(l, "It is your day.", "ဒီနေ့ဟာ သင့်နေ့ပါ။")),
      image(my(l, "A favourite moment", "အကြိုက်ဆုံး အခိုက်အတန့်")),
      message(my(l, "Here is everything I wanted to say today.", "ဒီနေ့ ပြောချင်တာအားလုံး ဒီမှာပါ။")),
      final(my(l, "Happy birthday,", "မွေးနေ့ပျော်ရွှင်ပါစေ")),
    ],
  },
  anniversary: {
    decoration: "hearts",
    layout: "scroll",
    defaultVariant: "night",
    defaultSections: (l) => [
      cover(my(l, "Happy Anniversary", "နှစ်ပတ်လည် ပျော်ရွှင်ပါစေ"), my(l, "Still my favourite person.", "အခုထိ အကြိုက်ဆုံးလူပါ။")),
      timeline([
        { date: my(l, "The beginning", "အစ"), title: my(l, "Where it started", "စတင်ခဲ့သည့်နေရာ"), text: "" },
        { date: my(l, "Today", "ဒီနေ့"), title: my(l, "Still here", "အခုထိ"), text: "" },
      ]),
      grid(my(l, "Us", "ကျွန်တော်တို့")),
      final(my(l, "Always,", "အမြဲတမ်း")),
    ],
  },
  friendship: {
    decoration: "sparkles",
    layout: "card",
    defaultVariant: "mint",
    defaultSections: (l) => [
      cover(my(l, "To my friend", "သူငယ်ချင်းဆီသို့")),
      message(my(l, "Thank you for always being there.", "အမြဲရှိနေပေးတာ ကျေးဇူးတင်ပါတယ်။")),
      quote(my(l, "Good friends are like stars. You do not always see them, but they are always there.", "သူငယ်ချင်းကောင်းတွေက ကြယ်တွေလိုပါ။ အမြဲမမြင်ရပေမယ့် အမြဲရှိနေပါတယ်။")),
      final(my(l, "Your friend,", "သင့်သူငယ်ချင်း")),
    ],
  },
  "thank-you": {
    decoration: "leaves",
    layout: "card",
    defaultVariant: "mint",
    defaultSections: (l) => [
      cover(my(l, "Thank you", "ကျေးဇူးတင်ပါတယ်")),
      message(my(l, "I wanted to say it properly.", "သေချာစွာ ပြောချင်ပါတယ်။")),
      final(my(l, "Gratefully,", "ကျေးဇူးတင်စွာဖြင့်")),
    ],
  },
  appreciation: {
    decoration: "sparkles",
    layout: "card",
    defaultVariant: "sunset",
    defaultSections: (l) => [
      cover(my(l, "You deserve to hear this", "ဒါကို သင်ကြားသင့်ပါတယ်")),
      message(my(l, "Here is what I notice and admire about you.", "သင့်အကြောင်း ကျွန်တော် သတိထားမိပြီး လေးစားတဲ့အရာများ။")),
      final(my(l, "With appreciation,", "လေးစားစွာဖြင့်")),
    ],
  },
  "miss-you": {
    decoration: "stars",
    layout: "card",
    defaultVariant: "night",
    defaultSections: (l) => [
      cover(my(l, "Miss you", "လွမ်းတယ်")),
      message(my(l, "The distance is long, but you are close.", "အကွာအဝေး ဝေးပေမယ့် သင်က နီးနေပါတယ်။")),
      image(),
      final(my(l, "Until soon,", "မကြာမီ ပြန်တွေ့မယ်")),
    ],
  },
  "general-postcard": {
    decoration: "petals",
    layout: "card",
    defaultVariant: "blossom",
    defaultSections: (l) => [
      cover(my(l, "Hello", "မင်္ဂလာပါ")),
      message(my(l, "Thinking of you.", "သင့်ကို သတိရနေပါတယ်။")),
      final(my(l, "From,", "မှ")),
    ],
  },
  "memory-timeline": {
    decoration: "stars",
    layout: "scroll",
    defaultVariant: "night",
    defaultSections: (l) => [
      cover(my(l, "Our memories", "ကျွန်တော်တို့ အမှတ်တရများ")),
      timeline([
        { date: "", title: my(l, "First memory", "ပထမ အမှတ်တရ"), text: "" },
        { date: "", title: my(l, "Second memory", "ဒုတိယ အမှတ်တရ"), text: "" },
        { date: "", title: my(l, "Third memory", "တတိယ အမှတ်တရ"), text: "" },
      ]),
      grid(),
      final(my(l, "To many more,", "နောက်ထပ်အမှတ်တရများအတွက်")),
    ],
  },
  congratulations: {
    decoration: "confetti",
    layout: "card",
    defaultVariant: "sunset",
    defaultSections: (l) => [
      cover(my(l, "Congratulations!", "ဂုဏ်ယူပါတယ်!")),
      message(my(l, "You did it. I am so proud of you.", "သင် လုပ်နိုင်ခဲ့ပါပြီ။ သင့်အတွက် အရမ်း ဂုဏ်ယူပါတယ်။")),
      final(my(l, "Cheers,", "ဂုဏ်ပြုလျက်")),
    ],
  },
};

export const fallbackStyle: TemplateStyle = {
  decoration: "petals",
  layout: "card",
  defaultVariant: "blossom",
  illustration: "/brand/lovebirds.webp",
};

export function getTemplateStyle(slug: string): TemplateStyle {
  const t = templates[slug];
  return t
    ? { decoration: t.decoration, layout: t.layout, defaultVariant: t.defaultVariant, illustration: illustrationFor(slug) }
    : fallbackStyle;
}

export function isAvailableTemplate(slug: string): boolean {
  return slug in templates;
}

export function defaultTheme(slug: string): GiftTheme {
  return { variant: getTemplateStyle(slug).defaultVariant };
}
