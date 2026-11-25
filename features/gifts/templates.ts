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
  | "invite"
  | "wedding"
  | "journey";

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
  /**
   * Set on invitations: a small line drawing for the head of the card,
   * drawn in the look's accent (components/gift/motifs.tsx), in place of the
   * illustration. The illustration still stands for the template elsewhere.
   */
  motif?: Motif;
};

/** The line drawings an invitation can carry at its head. */
export type Motif =
  | "rings"
  | "glasses"
  | "rattle"
  | "cap"
  | "house"
  | "plane"
  /** A lacquered alms bowl on its stand, for an ahlu (donation ceremony). */
  | "bowl"
  /** A ceremonial umbrella, carried over the novice in a shinbyu procession. */
  | "umbrella";

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
  wedding: "envelope",
  journey: "book",
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
/** Who is replying. One invitation link goes to many guests, so the host needs the name with the answer. */
const guestName = (l: Locale): Section => ({
  id: sid(),
  type: "question",
  content: {
    questionId: crypto.randomUUID(),
    kind: "short_text",
    prompt: my(l, "Your name", "သင့်နာမည်"),
    required: true,
    options: [],
  },
});
/**
 * A yes-or-no question the guest must answer: the RSVP, with its two answers
 * in the guest's words. Formal occasions pass their own answers, so a polite
 * question does not get casual replies.
 */
const rsvp = (
  l: Locale,
  prompt: string,
  answers: { yes: string; no: string } = {
    yes: my(l, "Yes, I'll be there", "လာမယ်"),
    no: my(l, "Sorry, I can't make it", "မလာနိုင်ပါဘူး"),
  },
): Section => ({
  id: sid(),
  type: "question",
  content: {
    questionId: crypto.randomUUID(),
    kind: "yes_no",
    prompt,
    required: true,
    options: [
      { id: crypto.randomUUID(), label: answers.yes },
      { id: crypto.randomUUID(), label: answers.no },
    ],
  },
});
/** How many are coming, so the host can count plates. Optional: a "no" needs no number. */
const headcount = (
  l: Locale,
  prompt = my(l, "How many of you are coming?", "ဘယ်နှယောက် လာမလဲ?"),
): Section => ({
  id: sid(),
  type: "question",
  content: {
    questionId: crypto.randomUUID(),
    kind: "count",
    prompt,
    required: false,
    options: [],
  },
});
const timeline = (items: { date: string; title: string; text: string }[]): Section => ({
  id: sid(),
  type: "timeline",
  content: { items: items.map((item) => ({ ...item, mediaId: null })) },
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
  // Valentine's Day: the elegant design in berry, a photo, a letter and the
  // question at its heart. Both answers say yes; that is the joke and the point.
  valentine: {
    design: "elegant",
    decoration: "hearts",
    layout: "scroll",
    defaultVariant: "berry",
    defaultSections: (l) => [
      cover(
        my(l, "Happy Valentine's Day", "ချစ်သူများနေ့ မင်္ဂလာပါ"),
        my(
          l,
          "For the one who makes every day feel like the fourteenth.",
          "နေ့တိုင်းကို ဖေဖော်ဝါရီ ၁၄ ရက်လို ခံစားရစေတဲ့ သင့်အတွက်။",
        ),
      ),
      image(my(l, "Us", "ကိုယ်တို့")),
      message(
        my(
          l,
          "I could write a hundred reasons, but the shortest one is this: life is better with you in it.",
          "အကြောင်းပြချက် အများကြီး ရေးလို့ရပေမယ့် အတိုဆုံးကတော့ ဒါပါ။ မင်းရှိနေတော့ ဘဝက ပိုလှတယ်။",
        ),
      ),
      rsvp(l, my(l, "Will you be my Valentine?", "ကိုယ့်ရဲ့ ချစ်သူ ဖြစ်ပေးမလား?"), {
        yes: my(l, "Yes 💕", "ဟုတ်ကဲ့ 💕"),
        no: my(l, "Of course, yes 💖", "ဒါပေါ့၊ ဟုတ်ကဲ့ 💖"),
      }),
      final(my(l, "All my love,", "ချစ်ခြင်းအားလုံးနဲ့")),
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
  "places-weve-been": {
    design: "journey",
    decoration: "hearts",
    layout: "scroll",
    defaultVariant: "blossom",
    defaultSections: (l) => [
      cover(
        my(l, "Places we've been", "ကျွန်တော်တို့ ရောက်ခဲ့တဲ့ နေရာများ"),
        my(l, "A map of us, one stop at a time.", "တစ်နေရာချင်း ကျွန်တော်တို့ရဲ့ မြေပုံ။"),
      ),
      timeline([
        {
          date: "2019",
          title: my(l, "Where it started", "စတင်ခဲ့သည့်နေရာ"),
          text: my(l, "The first trip, the first photo.", "ပထမဆုံး ခရီး၊ ပထမဆုံး ဓာတ်ပုံ။"),
        },
        { date: "2020", title: my(l, "The beach", "ကမ်းခြေ"), text: "" },
        { date: "2021", title: my(l, "The mountains", "တောင်တန်းများ"), text: "" },
        { date: "2023", title: my(l, "The city", "မြို့"), text: "" },
        {
          date: my(l, "Next", "နောက်တစ်ခု"),
          title: my(l, "The adventure continues…", "ခရီးက ဆက်သွားဦးမယ်…"),
          text: "",
        },
      ]),
      grid(my(l, "A few of the stops", "ရောက်ခဲ့တဲ့ နေရာအချို့")),
      final(my(l, "Here's to the next one,", "နောက်တစ်ခုအတွက်")),
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
    motif: "glasses",
    decoration: "confetti",
    layout: "card",
    defaultVariant: "noir",
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
      guestName(l),
      rsvp(l, my(l, "Can you make it?", "လာနိုင်မလား?")),
      headcount(l),
      final(my(l, "See you there,", "ပွဲမှာ တွေ့မယ်")),
    ],
  },
  "wedding-invitation": {
    design: "wedding",
    motif: "rings",
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
      guestName(l),
      rsvp(l, my(l, "Will you join us?", "လာရောက်ချီးမြှင့်နိုင်မလား?")),
      headcount(l),
      final(my(l, "With love,", "မေတ္တာဖြင့်")),
    ],
  },
  "baby-shower": {
    design: "invite",
    motif: "rattle",
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
      guestName(l),
      rsvp(l, my(l, "Will you come?", "လာမလား?")),
      headcount(l),
      final(my(l, "Can't wait to see you,", "တွေ့ရဖို့ စောင့်နေမယ်")),
    ],
  },
  "graduation-party": {
    design: "invite",
    motif: "cap",
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
      guestName(l),
      rsvp(l, my(l, "Are you coming?", "လာမလား?")),
      headcount(l),
      final(my(l, "Proudly,", "ဂုဏ်ယူစွာဖြင့်")),
    ],
  },
  housewarming: {
    design: "invite",
    motif: "house",
    decoration: "sparkles",
    layout: "card",
    defaultVariant: "champagne",
    defaultSections: (l) => [
      cover(
        my(l, "We've moved in!", "ကျွန်တော်တို့ အိမ်သစ် ပြောင်းပြီးပါပြီ!"),
        my(l, "Come see our new home.", "ကျွန်တော်တို့ အိမ်သစ်ကို လာကြည့်ပါ။"),
      ),
      event({
        date: my(l, "Saturday 8 March", "မတ် ၈ ရက်၊ စနေနေ့"),
        time: my(l, "5 pm", "ညနေ ၅ နာရီ"),
        place: my(l, "Our new home, Yangon", "ကျွန်တော်တို့ အိမ်သစ်၊ ရန်ကုန်"),
        note: my(l, "Bring nothing but yourselves.", "ဘာမှ ယူမလာပါနဲ့၊ ကိုယ်တိုင်ပဲ လာပါ။"),
      }),
      message(
        my(
          l,
          "A new address, the same open door.",
          "လိပ်စာသစ်ပါ၊ ဖွင့်ထားတဲ့တံခါးကတော့ အတူတူပါပဲ။",
        ),
      ),
      guestName(l),
      rsvp(l, my(l, "Can you drop by?", "လာလည်နိုင်မလား?")),
      headcount(l),
      final(my(l, "Warmly,", "နွေးထွေးစွာဖြင့်")),
    ],
  },
  "engagement-party": {
    design: "wedding",
    motif: "rings",
    decoration: "hearts",
    layout: "scroll",
    defaultVariant: "ivory",
    defaultSections: (l) => [
      cover(
        my(l, "We said yes", "ကျွန်တော်တို့ စေ့စပ်ပါပြီ"),
        my(l, "Join us to celebrate our engagement.", "စေ့စပ်ပွဲကို လာရောက် ဂုဏ်ပြုပေးပါ။"),
      ),
      event({
        date: my(l, "Saturday 24 January", "ဇန်နဝါရီ ၂၄ ရက်၊ စနေနေ့"),
        time: my(l, "6 pm", "ညနေ ၆ နာရီ"),
        place: my(l, "Lotus Garden, Mandalay", "ကြာပန်းဥယျာဉ်၊ မန္တလေး"),
        note: my(l, "Dinner and dancing.", "ညစာနဲ့ ကခုန်ခြင်း ပါမယ်။"),
      }),
      message(my(l, "Two families, one happy evening.", "မိသားစုနှစ်စု၊ ပျော်ရွှင်တဲ့ ညနေတစ်ခု။")),
      guestName(l),
      rsvp(l, my(l, "Will you celebrate with us?", "အတူ ဂုဏ်ပြုပေးမလား?")),
      headcount(l),
      final(my(l, "With love,", "မေတ္တာဖြင့်")),
    ],
  },
  "farewell-party": {
    design: "invite",
    motif: "plane",
    decoration: "confetti",
    layout: "card",
    defaultVariant: "forest",
    defaultSections: (l) => [
      cover(
        my(l, "Farewell party", "နှုတ်ဆက်ပွဲ"),
        my(
          l,
          "One last evening together before the next chapter.",
          "နောက်အခန်းမစခင် နောက်ဆုံး ညနေတစ်ခု အတူတူ။",
        ),
      ),
      event({
        date: my(l, "Friday 30 May", "မေ ၃၀ ရက်၊ သောကြာနေ့"),
        time: my(l, "7 pm", "ညနေ ၇ နာရီ"),
        place: my(l, "The usual place", "အမြဲတမ်း နေရာ"),
        note: my(l, "Stories welcome, tears allowed.", "ပုံပြင်တွေ ယူလာပါ၊ မျက်ရည်လည်း ရပါတယ်။"),
      }),
      message(
        my(
          l,
          "Come say see you soon, not goodbye.",
          "နှုတ်ဆက်ဖို့ မဟုတ်ဘဲ မကြာခင် ပြန်တွေ့မယ်လို့ ပြောဖို့ လာပါ။",
        ),
      ),
      guestName(l),
      rsvp(l, my(l, "Can you come?", "လာနိုင်မလား?")),
      headcount(l),
      final(my(l, "See you soon,", "မကြာခင် ပြန်တွေ့မယ်")),
    ],
  },
  // Myanmar ceremonies. Both are formal: the wedding design in gold, the
  // programme as a timeline (times in the date line), the hosts in the
  // message, and the guest count so the family knows how many to feed.
  ahlu: {
    design: "wedding",
    motif: "bowl",
    decoration: "sparkles",
    layout: "scroll",
    defaultVariant: "ivory",
    defaultSections: (l) => [
      cover(
        my(l, "A merit-making ceremony", "ကုသိုလ်ရေး အလှူမင်္ဂလာ"),
        my(
          l,
          "Our family warmly invites you to our donation ceremony.",
          "ကျွန်ုပ်တို့ မိသားစု ကျင်းပမည့် အလှူမင်္ဂလာသို့ ကြွရောက်ချီးမြှင့်ပါရန် လေးစားစွာ ဖိတ်ကြားအပ်ပါသည်။",
        ),
      ),
      event({
        date: my(l, "Sunday 18 January", "ဇန်နဝါရီ ၁၈ ရက်၊ တနင်္ဂနွေနေ့"),
        time: my(l, "From 7 am", "နံနက် ၇ နာရီမှစ၍"),
        place: my(l, "Our home, Bahan, Yangon", "နေအိမ်၊ ဗဟန်းမြို့နယ်၊ ရန်ကုန်"),
        note: my(
          l,
          "A meal is offered to all guests.",
          "ဧည့်သည်တော်များကို ဆွမ်းကျွေး ဧည့်ခံပါမည်။",
        ),
      }),
      timeline([
        {
          date: my(l, "7:00 am", "နံနက် ၇:၀၀"),
          title: my(
            l,
            "Monks arrive, paritta chanting",
            "သံဃာတော်များ ကြွရောက်၊ ပရိတ်တရားတော် နာယူ",
          ),
          text: "",
        },
        {
          date: my(l, "9:00 am", "နံနက် ၉:၀၀"),
          title: my(l, "Offering of the meal to the monks", "ဆွမ်းဆက်ကပ် လှူဒါန်း"),
          text: "",
        },
        {
          date: my(l, "9:30 am", "နံနက် ၉:၃၀"),
          title: my(l, "Guests are served", "ဧည့်သည်တော်များ ဧည့်ခံကျွေးမွေး"),
          text: "",
        },
      ]),
      message(
        my(
          l,
          "Hosts: U Maung Maung, Daw Aye Aye and family",
          "အလှူရှင် − ဦးမောင်မောင် + ဒေါ်အေးအေး နှင့် သားသမီးများ",
        ),
      ),
      guestName(l),
      rsvp(l, my(l, "Will you be able to join us?", "ကြွရောက်နိုင်ပါမည်လား?"), {
        yes: my(l, "I will attend", "ကြွရောက်ပါမည်"),
        no: my(l, "I regret I cannot attend", "မကြွရောက်နိုင်ပါ"),
      }),
      headcount(l, my(l, "How many will attend?", "ကြွရောက်မည့် ဦးရေ")),
      final(my(l, "With gratitude,", "သာဓု သာဓု သာဓု")),
    ],
  },
  shinbyu: {
    design: "wedding",
    motif: "umbrella",
    decoration: "sparkles",
    layout: "scroll",
    defaultVariant: "champagne",
    defaultSections: (l) => [
      cover(
        my(l, "A novitiation ceremony", "ရှင်ပြုအလှူ မင်္ဂလာ"),
        my(
          l,
          "We warmly invite you to the shinbyu of our son.",
          "ကျွန်ုပ်တို့၏ သားရတနာ ရှင်ပြုအလှူမင်္ဂလာသို့ ကြွရောက်ချီးမြှင့်ပါရန် လေးစားစွာ ဖိတ်ကြားအပ်ပါသည်။",
        ),
      ),
      message(
        my(l, "Novice-to-be: Maung Htet Aung, aged 9", "ရှင်လောင်း − မောင်ထက်အောင် (အသက် ၉ နှစ်)"),
      ),
      event({
        date: my(l, "Saturday 21 March", "မတ် ၂၁ ရက်၊ စနေနေ့"),
        time: my(l, "From 6 am", "နံနက် ၆ နာရီမှစ၍"),
        place: my(l, "Shwe Taung Monastery, Mandalay", "ရွှေတောင်ကျောင်းတိုက်၊ မန္တလေး"),
        note: my(
          l,
          "A meal is offered to all guests.",
          "ဧည့်သည်တော်များကို ဆွမ်းကျွေး ဧည့်ခံပါမည်။",
        ),
      }),
      timeline([
        {
          date: my(l, "6:00 am", "နံနက် ၆:၀၀"),
          title: my(l, "Procession of the novice-to-be", "ရှင်လောင်းလှည့်"),
          text: "",
        },
        {
          date: my(l, "9:00 am", "နံနက် ၉:၀၀"),
          title: my(
            l,
            "Offering of the meal, guests are served",
            "ဆွမ်းဆက်ကပ်လှူဒါန်း၊ ဧည့်ခံကျွေးမွေး",
          ),
          text: "",
        },
        {
          date: my(l, "11:00 am", "နံနက် ၁၁:၀၀"),
          title: my(l, "Robing as a novice", "သင်္ကန်းဆက်ကပ်၊ ရှင်ပြုခြင်း"),
          text: "",
        },
      ]),
      guestName(l),
      rsvp(l, my(l, "Will you be able to join us?", "ကြွရောက်နိုင်ပါမည်လား?"), {
        yes: my(l, "I will attend", "ကြွရောက်ပါမည်"),
        no: my(l, "I regret I cannot attend", "မကြွရောက်နိုင်ပါ"),
      }),
      headcount(l, my(l, "How many will attend?", "ကြွရောက်မည့် ဦးရေ")),
      final(
        my(l, "With gratitude,", "သာဓု သာဓု သာဓု"),
        my(l, "U Kyaw Win, Daw Hnin Si and family", "ဦးကျော်ဝင်း + ဒေါ်နှင်းဆီ နှင့် မိသားစု"),
      ),
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
        motif: t.motif,
      }
    : fallbackStyle;
}

/** Whether a design is an invitation: the receiver is asked to come, not given a gift. */
export function isInvitationDesign(design: Design): boolean {
  return design === "invite" || design === "wedding";
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
