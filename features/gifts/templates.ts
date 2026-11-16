import type { GiftTheme, Opening, Section, ThemeVariant } from "./schemas";
import { defaultScene, type SceneKind } from "./scene";

/**
 * Code-side template registry. The database holds template metadata (name,
 * price, category); how a template looks lives here. All templates share one
 * section renderer and differ by decoration, layout, default look and the
 * sections they start with.
 */
export type Decoration =
  "petals" | "stars" | "confetti" | "hearts" | "sparkles" | "leaves" | "party";

/** card: one framed card. scroll: each section is its own card, revealed as you scroll. */
export type Layout = "card" | "scroll";

/**
 * Visual design of a template: frame, heading treatment, background pattern
 * and how sections are dressed. See components/gift/gift-renderer.tsx.
 */
export type Design =
  | "postcard"
  | "party"
  | "elegant"
  | "playful"
  | "botanical"
  | "certificate"
  | "letter"
  | "minimal"
  | "scrapbook"
  | "bold"
  | "blank"
  | "garden"
  | "invite";

export type TemplateStyle = {
  decoration: Decoration;
  layout: Layout;
  design: Design;
  defaultVariant: ThemeVariant;
  /** Opening animation a new gift starts with. Follows the design. */
  defaultOpening: Opening;
  /** Composed scene for this template, from scripts/compose-illustrations.mjs. */
  illustration: string;
  /**
   * Set on templates whose gift is an animation. The receiver sees the
   * animation; the design above is only its summary card, used wherever a
   * still picture of the gift is needed (editor, dashboard, thumbnails).
   */
  scene?: SceneKind;
};

const illustrationFor = (slug: string) => `/brand/illustrations/${slug}.webp`;

type Locale = "en" | "my";

/** Each design opens the way its object would: a postcard in an envelope, a certificate as a scroll. */
const designOpening: Record<Design, Opening> = {
  postcard: "envelope",
  party: "giftbox",
  elegant: "curtain",
  playful: "giftbox",
  botanical: "book",
  certificate: "scroll",
  letter: "envelope",
  minimal: "simple",
  scrapbook: "book",
  bold: "curtain",
  blank: "simple",
  garden: "simple",
  invite: "envelope",
};

export type TemplateDefinition = Omit<TemplateStyle, "illustration" | "defaultOpening"> & {
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
const image = (caption = ""): Section => ({
  id: sid(),
  type: "image",
  content: { mediaId: null, caption },
});
const grid = (caption = ""): Section => ({
  id: sid(),
  type: "photo_grid",
  content: { mediaIds: [], caption },
});
const quote = (text: string, attribution = ""): Section => ({
  id: sid(),
  type: "quote",
  content: { text, attribution },
});
const final = (text: string, signature = ""): Section => ({
  id: sid(),
  type: "final_message",
  content: { text, signature },
});
/** When and where. All free text; see eventContentSchema. */
const event = (details: { date: string; time: string; place: string; note: string }): Section => ({
  id: sid(),
  type: "event",
  content: details,
});
/** A yes-or-no question the guest must answer: the RSVP. */
const rsvp = (prompt: string): Section => ({
  id: sid(),
  type: "question",
  content: { questionId: crypto.randomUUID(), kind: "yes_no", prompt, required: true, options: [] },
});
const timeline = (items: { date: string; title: string; text: string }[]): Section => ({
  id: sid(),
  type: "timeline",
  content: { items },
});

export const templates: Record<string, TemplateDefinition> = {
  // An empty card for creators who want to build everything themselves. It
  // starts with the least a gift needs, in a neutral look, with nothing drawn
  // on it. The starter text is there only because a heading and a message
  // may not be empty; both are meant to be typed over.
  blank: {
    design: "blank",
    decoration: "petals",
    layout: "card",
    defaultVariant: "ivory",
    defaultSections: (l) => [
      cover(my(l, "Your title", "သင့်ခေါင်းစဉ်")),
      message(my(l, "Write your message here.", "သင့်စာကို ဒီမှာ ရေးပါ။")),
    ],
  },
  // An animated twilight garden: flowers grow and bloom, then the name and
  // the message appear, typed a line at a time. The first heading is the
  // name; every message is one page of the text, so two short lines each.
  "night-garden": {
    design: "garden",
    decoration: "stars",
    layout: "card",
    defaultVariant: "night",
    scene: "night-garden",
    defaultSections: (l) => [
      cover(my(l, "My Dear", "ချစ်ရသူ")),
      message(
        my(
          l,
          "You've been working so hard lately…\nI know you're tired",
          "ဒီရက်ပိုင်း အရမ်း ကြိုးစားနေတာ သိတယ်…\nပင်ပန်းနေမှန်းလည်း သိတယ်",
        ),
      ),
      message(
        my(
          l,
          "So take a little break with me\nand watch these flowers bloom 🌸",
          "ခဏလောက် အနားယူပြီး\nဒီပန်းလေးတွေ ပွင့်တာ ကြည့်ရအောင် 🌸",
        ),
      ),
      message(
        my(
          l,
          "Every single one of them\nbloomed just for you",
          "ပန်းတစ်ပွင့်ချင်းစီတိုင်းက\nမင်းအတွက်ပဲ ပွင့်တာပါ",
        ),
      ),
      message(
        my(
          l,
          "You're stronger than you know\nand you're never alone 💛",
          "မင်းက ထင်တာထက် ပိုသန်မာတယ်\nဘယ်တော့မှ တစ်ယောက်တည်း မဟုတ်ဘူး 💛",
        ),
      ),
      message(
        my(
          l,
          "Rest well, and smile a little\nI love you so much ❤️",
          "ကောင်းကောင်း အနားယူပြီး နည်းနည်းလေး ပြုံးပါ\nအရမ်း ချစ်တယ် ❤️",
        ),
      ),
    ],
  },
  "birthday-postcard": {
    design: "postcard",
    decoration: "party",
    layout: "card",
    defaultVariant: "celebrate",
    defaultSections: (l) => [
      cover(
        my(l, "Happy Birthday!", "မွေးနေ့ပျော်ရွှင်ပါစေ"),
        my(l, "Make a wish. Today is all yours.", "ဆုတောင်းလိုက်ပါ။ ဒီနေ့ဟာ သင့်အတွက်ပါ။"),
      ),
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
    design: "party",
    decoration: "confetti",
    layout: "scroll",
    defaultVariant: "sunset",
    defaultSections: (l) => [
      cover(my(l, "Surprise!", "အံ့အားသင့်စရာ!"), my(l, "It is your day.", "ဒီနေ့ဟာ သင့်နေ့ပါ။")),
      image(my(l, "A favourite moment", "အကြိုက်ဆုံး အခိုက်အတန့်")),
      message(
        my(l, "Here is everything I wanted to say today.", "ဒီနေ့ ပြောချင်တာအားလုံး ဒီမှာပါ။"),
      ),
      final(my(l, "Happy birthday,", "မွေးနေ့ပျော်ရွှင်ပါစေ")),
    ],
  },
  anniversary: {
    design: "elegant",
    decoration: "hearts",
    layout: "scroll",
    defaultVariant: "night",
    defaultSections: (l) => [
      cover(
        my(l, "Happy Anniversary", "နှစ်ပတ်လည် ပျော်ရွှင်ပါစေ"),
        my(l, "Still my favourite person.", "အခုထိ အကြိုက်ဆုံးလူပါ။"),
      ),
      timeline([
        {
          date: my(l, "The beginning", "အစ"),
          title: my(l, "Where it started", "စတင်ခဲ့သည့်နေရာ"),
          text: "",
        },
        { date: my(l, "Today", "ဒီနေ့"), title: my(l, "Still here", "အခုထိ"), text: "" },
      ]),
      grid(my(l, "Us", "ကျွန်တော်တို့")),
      final(my(l, "Always,", "အမြဲတမ်း")),
    ],
  },
  friendship: {
    design: "playful",
    decoration: "sparkles",
    layout: "card",
    defaultVariant: "mint",
    defaultSections: (l) => [
      cover(my(l, "To my friend", "သူငယ်ချင်းဆီသို့")),
      message(my(l, "Thank you for always being there.", "အမြဲရှိနေပေးတာ ကျေးဇူးတင်ပါတယ်။")),
      quote(
        my(
          l,
          "Good friends are like stars. You do not always see them, but they are always there.",
          "သူငယ်ချင်းကောင်းတွေက ကြယ်တွေလိုပါ။ အမြဲမမြင်ရပေမယ့် အမြဲရှိနေပါတယ်။",
        ),
      ),
      final(my(l, "Your friend,", "သင့်သူငယ်ချင်း")),
    ],
  },
  "thank-you": {
    design: "botanical",
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
    design: "certificate",
    decoration: "sparkles",
    layout: "card",
    defaultVariant: "sunset",
    defaultSections: (l) => [
      cover(my(l, "You deserve to hear this", "ဒါကို သင်ကြားသင့်ပါတယ်")),
      message(
        my(
          l,
          "Here is what I notice and admire about you.",
          "သင့်အကြောင်း ကျွန်တော် သတိထားမိပြီး လေးစားတဲ့အရာများ။",
        ),
      ),
      final(my(l, "With appreciation,", "လေးစားစွာဖြင့်")),
    ],
  },
  "miss-you": {
    design: "letter",
    decoration: "stars",
    layout: "card",
    defaultVariant: "night",
    defaultSections: (l) => [
      cover(my(l, "Miss you", "လွမ်းတယ်")),
      message(
        my(l, "The distance is long, but you are close.", "အကွာအဝေး ဝေးပေမယ့် သင်က နီးနေပါတယ်။"),
      ),
      image(),
      final(my(l, "Until soon,", "မကြာမီ ပြန်တွေ့မယ်")),
    ],
  },
  "general-postcard": {
    design: "minimal",
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
    design: "scrapbook",
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
    design: "bold",
    decoration: "confetti",
    layout: "card",
    defaultVariant: "sunset",
    defaultSections: (l) => [
      cover(my(l, "Congratulations!", "ဂုဏ်ယူပါတယ်!")),
      message(
        my(
          l,
          "You did it. I am so proud of you.",
          "သင် လုပ်နိုင်ခဲ့ပါပြီ။ သင့်အတွက် အရမ်း ဂုဏ်ယူပါတယ်။",
        ),
      ),
      final(my(l, "Cheers,", "ဂုဏ်ပြုလျက်")),
    ],
  },
};

// Invitations: every one starts with the event details and an RSVP question.
// The party ones share the ticket-like invite design; the wedding has its own.
const invitations: Record<string, TemplateDefinition> = {
  "party-invitation": {
    design: "invite",
    decoration: "confetti",
    layout: "card",
    defaultVariant: "celebrate",
    defaultSections: (l) => [
      cover(
        my(l, "You're invited!", "ဖိတ်ကြားပါတယ်!"),
        my(l, "Come celebrate with us.", "အတူတူ ပျော်ရွှင်ကြရအောင်။"),
      ),
      event({
        date: my(l, "Saturday 21 December", "ဒီဇင်ဘာ ၂၁ ရက်၊ စနေနေ့"),
        time: my(l, "7 pm until late", "ညနေ ၇ နာရီမှ"),
        place: my(l, "Our place", "ကျွန်တော်တို့အိမ်"),
        note: my(l, "Bring your dancing shoes.", "ကခုန်ဖို့ အဆင်သင့် ပြင်လာပါ။"),
      }),
      message(my(l, "It would not be the same without you.", "သင်မပါရင် ဒီပွဲ မပြည့်စုံပါဘူး။")),
      rsvp(my(l, "Can you make it?", "လာနိုင်မလား?")),
      final(my(l, "See you there,", "ပွဲမှာ တွေ့မယ်")),
    ],
  },
  "wedding-invitation": {
    design: "elegant",
    decoration: "hearts",
    layout: "scroll",
    defaultVariant: "champagne",
    defaultSections: (l) => [
      cover(
        my(l, "We're getting married", "ကျွန်တော်တို့ လက်ထပ်ပါတော့မယ်"),
        my(l, "and we would love to have you there.", "သင့်ကို လေးလေးစားစား ဖိတ်ကြားအပ်ပါတယ်။"),
      ),
      event({
        date: my(l, "Sunday 15 February", "ဖေဖော်ဝါရီ ၁၅ ရက်၊ တနင်္ဂနွေနေ့"),
        time: my(l, "4 pm", "ညနေ ၄ နာရီ"),
        place: my(l, "Garden Hall, Yangon", "ဂါးဒင်းခန်းမ၊ ရန်ကုန်"),
        note: my(l, "Dress in soft colours.", "အရောင်နုနု ဝတ်ဆင်လာပါ။"),
      }),
      message(
        my(
          l,
          "Your presence is the greatest gift we could ask for.",
          "သင်ရှိနေခြင်းက ကျွန်တော်တို့အတွက် အကြီးမားဆုံး လက်ဆောင်ပါ။",
        ),
      ),
      rsvp(my(l, "Will you join us?", "လာရောက်ချီးမြှင့်နိုင်မလား?")),
      final(my(l, "With love,", "မေတ္တာဖြင့်")),
    ],
  },
  "baby-shower": {
    design: "invite",
    decoration: "sparkles",
    layout: "card",
    defaultVariant: "mint",
    defaultSections: (l) => [
      cover(
        my(l, "A little one is on the way", "ကလေးငယ်တစ်ယောက် ရောက်လာတော့မယ်"),
        my(l, "Join us for a baby shower.", "ကလေးကြိုဆိုပွဲကို လာရောက်ပါ။"),
      ),
      event({
        date: my(l, "Sunday 2 March", "မတ် ၂ ရက်၊ တနင်္ဂနွေနေ့"),
        time: my(l, "2 pm", "နေ့လယ် ၂ နာရီ"),
        place: my(l, "At home", "အိမ်မှာ"),
        note: my(l, "Tea, cake and a few games.", "လက်ဖက်ရည်၊ ကိတ်နဲ့ ဂိမ်းလေးတွေ ပါမယ်။"),
      }),
      message(
        my(
          l,
          "Come share the joy before the big arrival.",
          "ရောက်မလာခင် ပျော်ရွှင်မှုကို အတူ မျှဝေရအောင်။",
        ),
      ),
      rsvp(my(l, "Will you come?", "လာမလား?")),
      final(my(l, "Can't wait to see you,", "တွေ့ရဖို့ စောင့်နေမယ်")),
    ],
  },
  "graduation-party": {
    design: "invite",
    decoration: "confetti",
    layout: "card",
    defaultVariant: "ivory",
    defaultSections: (l) => [
      cover(
        my(l, "Graduation party!", "ဘွဲ့ရပွဲ!"),
        my(
          l,
          "The hard part is done. Come celebrate.",
          "ခက်ခဲတာတွေ ပြီးသွားပြီ။ လာပြီး အတူ ဂုဏ်ပြုကြရအောင်။",
        ),
      ),
      event({
        date: my(l, "Friday 9 January", "ဇန်နဝါရီ ၉ ရက်၊ သောကြာနေ့"),
        time: my(l, "6 pm", "ညနေ ၆ နာရီ"),
        place: my(l, "The rooftop", "အမိုးပေါ်"),
        note: my(l, "Caps optional.", "ဦးထုပ် ပါပါ မပါပါ ရပါတယ်။"),
      }),
      message(
        my(
          l,
          "Cheer with us for everything that got us here.",
          "ဒီအထိ ရောက်အောင် ပို့ဆောင်ပေးခဲ့သမျှအတွက် အတူ ဂုဏ်ပြုကြရအောင်။",
        ),
      ),
      rsvp(my(l, "Are you coming?", "လာမလား?")),
      final(my(l, "Proudly,", "ဂုဏ်ယူစွာဖြင့်")),
    ],
  },
};
Object.assign(templates, invitations);

export const fallbackStyle: TemplateStyle = {
  decoration: "petals",
  layout: "card",
  design: "minimal",
  defaultVariant: "blossom",
  defaultOpening: "simple",
  illustration: "/brand/lovebirds.webp",
};

export function getTemplateStyle(slug: string): TemplateStyle {
  const t = templates[slug];
  return t
    ? {
        decoration: t.decoration,
        layout: t.layout,
        design: t.design,
        defaultVariant: t.defaultVariant,
        defaultOpening: designOpening[t.design],
        illustration: illustrationFor(slug),
        scene: t.scene,
      }
    : fallbackStyle;
}

export function isAvailableTemplate(slug: string): boolean {
  return slug in templates;
}

export function defaultTheme(slug: string): GiftTheme {
  const style = getTemplateStyle(slug);
  return {
    variant: style.defaultVariant,
    opening: style.defaultOpening,
    ...(style.scene && { scene: defaultScene }),
  };
}
