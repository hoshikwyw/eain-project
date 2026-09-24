import type { LegalContent } from "./types";

const updated = "2026-09-24";

export const en: LegalContent = {
  privacy: {
    title: "Privacy",
    intro: "Your memories are yours. This page explains what Eain collects, why, and the control you have.",
    updated,
    summary: [
      "We collect only what is needed to run Eain: your account details, the gifts you create, and basic technical logs.",
      "Gift content is private by default and visible only through the link you choose to share.",
      "Receivers never need an account. We do not track their location, device fingerprint or IP address in gift analytics.",
      "We do not sell personal data, and we do not use private gift content for advertising or to train AI.",
      "You can delete a gift at any time. Account deletion is coming; until then, ask us and we will do it.",
    ],
    sections: [
      {
        heading: "What we collect",
        body: [
          "Account data: your email address, display name, language preference and notification settings. If you sign in with Google, we receive your name, email and profile picture from Google.",
          "Gift data: the titles, text, photos, questions, recipient names and theme choices you add to a gift, and the replies receivers send you.",
          "Activity data: events such as created, published, opened, viewed and responded, with timestamps. Receiver events carry a random browser session id so repeat views are not double counted. They do not carry an IP address, location or device details.",
          "Technical data: server logs kept by our hosting providers for security and debugging, and short-lived rate-limit counters that store a salted hash of an IP address, never the address itself.",
        ],
      },
      {
        heading: "Why we collect it",
        body: [
          "To provide the service: store your gifts, show them to the people you share them with, deliver replies to you, and show your points balance.",
          "To keep Eain safe: prevent abuse, enforce limits, and investigate reports.",
          "To improve Eain: understand which features are used, in aggregate. We do not use private gift content for this.",
        ],
      },
      {
        heading: "How gifts are shared",
        body: [
          "A published gift is reachable only through its secret link. Anyone who has the link can open it, so share it only with the person it is for.",
          "You can unpublish a gift, create a new link that makes the old one stop working, or delete the gift. Link previews in chat apps show only a generic message, never your text, names or photos.",
        ],
      },
      {
        heading: "Who can see what",
        body: [
          "You see your own gifts, replies, points and notifications. Nobody else can read another creator's gifts or replies. This is enforced by database rules, not only by the interface.",
          "Receivers see the gift content and can reply. They cannot see your account details, your other gifts or anyone else's replies.",
          "Eain administrators can review a gift only when it has been reported. Every administrator action is logged.",
        ],
      },
      {
        heading: "Third parties",
        body: [
          "Eain runs on Supabase (database, authentication, file storage) and Vercel (web hosting). They process data on our behalf under their own security commitments.",
          "If you use Google sign-in, Google processes your login under its own privacy policy.",
          "We do not sell personal data. We do not share gift content with advertisers.",
        ],
      },
      {
        heading: "Retention and deletion",
        body: [
          "Your gifts stay as long as you keep them. Deleting a gift disables its link immediately and schedules its content and photos for permanent removal.",
          "Replies are deleted with the gift they belong to. Activity events are trimmed after a set period. Point transactions are kept as an accounting record.",
          "Rate-limit counters expire within hours. Exact retention periods will be published here before public launch.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          "Edit your name, language and notification settings at any time in Settings.",
          "Delete any gift from its page. To delete your whole account, contact us and we will remove it along with your gifts, photos and replies, keeping only records we must retain for accounting or security.",
        ],
      },
      {
        heading: "AI",
        body: [
          "Eain does not currently use AI on your content. If we add AI features later, we will explain here what is sent, why, and how to opt out. Private gift content will never be used to train AI models without your explicit permission.",
        ],
      },
      {
        heading: "Children",
        body: ["Eain is not directed at children under 13. If you believe a child has created an account, contact us and we will remove it."],
      },
      {
        heading: "Changes and contact",
        body: [
          "We will update this page when our practices change and show the date above. Questions and requests: use the Contact page.",
          "This text is a draft written by the Eain team. It will be reviewed by a lawyer before public launch.",
        ],
      },
    ],
  },

  terms: {
    title: "Terms of Service",
    intro: "The short version: make gifts, be kind, respect other people's content and privacy.",
    updated,
    summary: [
      "Eain lets you create digital gifts and share them by link or QR code. Receivers do not need an account.",
      "You own what you create and upload. You give Eain only the permission needed to store and show it.",
      "Do not use Eain to harass, scam, spam or share content you have no right to share.",
      "Eain Points are a virtual currency inside Eain. During the first launch they are earned, not bought, and have no cash value.",
      "The service is provided as is while we are in early launch. We can suspend accounts that break these rules.",
    ],
    sections: [
      {
        heading: "The service",
        body: [
          "Eain provides tools to create digital gifts such as cards, memory pages and interactive gifts, to publish them at a private link, and to receive replies.",
          "Eain is in early launch. Features may change, and free-tier limits such as the number of gifts and photos per account apply.",
        ],
      },
      {
        heading: "Your account",
        body: [
          "You must be at least 13 years old. Keep your login details safe; you are responsible for activity on your account.",
          "You can sign in with email and password or with Google.",
        ],
      },
      {
        heading: "Your content",
        body: [
          "You keep all rights to the text, photos and other content you add to Eain.",
          "You grant Eain a limited licence to store, process, display and transmit your content solely to operate the service, including showing a gift to the people you share it with.",
          "You are responsible for having the right to use what you upload, including photos of other people.",
        ],
      },
      {
        heading: "Acceptable use",
        body: [
          "Do not use Eain to harass, threaten or bully anyone, to send spam or scams, to share sexual content involving minors, to infringe copyright, or to distribute malicious links.",
          "Do not try to access other users' data, bypass limits or interfere with the service.",
          "Anyone with a gift link can report it. We may take reported gifts offline and suspend accounts that break these rules.",
        ],
      },
      {
        heading: "Gift links",
        body: [
          "A published gift is available to anyone who has its link. You decide who receives it. You can unpublish, regenerate the link or delete the gift at any time.",
        ],
      },
      {
        heading: "Eain Points",
        body: [
          "Points unlock premium templates and features. They are recorded in an auditable ledger and cannot be transferred between accounts.",
          "During the first launch, payments are switched off. Points are granted as a welcome bonus and earned through activity. They have no cash value and cannot be refunded or exchanged.",
          "When paid points are introduced, this section and a refund policy will be updated before purchases are possible.",
        ],
      },
      {
        heading: "Suspension and termination",
        body: [
          "We may suspend or close accounts that break these terms or put other users at risk. You can stop using Eain at any time and ask us to delete your account.",
        ],
      },
      {
        heading: "Disclaimers and liability",
        body: [
          "Eain is provided as is, without warranties of uninterrupted availability. We do our best to keep your gifts safe and available, but we recommend keeping copies of important photos.",
          "To the extent permitted by law, Eain is not liable for indirect or consequential losses arising from use of the service.",
        ],
      },
      {
        heading: "Changes and law",
        body: [
          "We may update these terms and will show the date above. Continued use after a change means you accept the new terms.",
          "The governing law and dispute process will be set out here after legal review. This text is a draft written by the Eain team and will be reviewed by a lawyer before public launch.",
        ],
      },
    ],
  },

  security: {
    title: "Security",
    intro: "We use reasonable, industry-standard measures to protect your gifts, and we keep improving them. No service can promise perfect security.",
    updated,
    summary: [
      "HTTPS everywhere, secure authentication, and no passwords stored by Eain itself.",
      "Every private table is protected by database row-level rules, so one creator cannot read another's data.",
      "Photos live in private storage and are served through short-lived signed links.",
      "Gift links use long random tokens that cannot be guessed. You can regenerate a link at any time.",
      "Administrator actions are narrow, logged and reviewable.",
    ],
    sections: [
      {
        heading: "Accounts",
        body: [
          "Authentication is handled by Supabase Auth. Passwords are hashed by the provider; Eain never sees or stores them. Google sign-in uses the standard OAuth flow.",
        ],
      },
      {
        heading: "Data access",
        body: [
          "Row-level security rules in the database decide who can read or change every row. The interface cannot bypass them.",
          "Receivers never talk to the database directly. Public gift pages go through server code that looks up the secret token and returns only gift content.",
          "Points can change only through a single audited function. Users cannot edit their own balance or role.",
        ],
      },
      {
        heading: "Media",
        body: [
          "Uploaded images are checked by their real file signature, size and dimensions on the server, then stored in a private bucket. They are shown through signed links that expire after one hour.",
        ],
      },
      {
        heading: "Abuse protection",
        body: [
          "Public endpoints are rate limited. Per-account limits on gifts and photos protect the shared free infrastructure. Reports from receivers are reviewed by administrators, whose every action is logged.",
        ],
      },
      {
        heading: "Reporting a security issue",
        body: [
          "If you find a vulnerability, please tell us through the Contact page before disclosing it publicly. We will acknowledge, fix, and let affected users know when disclosure is required.",
        ],
      },
    ],
  },

  cookies: {
    title: "Cookie Policy",
    intro: "Eain uses a small number of cookies and browser storage entries, all of them needed for the service to work.",
    updated,
    summary: [
      "Login session cookies keep you signed in.",
      "A language cookie remembers English or Burmese.",
      "Browser storage remembers your theme choice, a random session id for gift pages, and whether you already replied to a gift.",
      "There are no advertising cookies. There are no analytics cookies yet; if we add privacy-friendly analytics we will say so here.",
    ],
    sections: [
      {
        heading: "Necessary cookies",
        body: [
          "Authentication cookies set by Supabase keep your session and are required to use your account.",
          "EAIN_LOCALE stores your language preference for one year and contains only the value en or my.",
        ],
      },
      {
        heading: "Browser storage",
        body: [
          "Your theme choice (light or dark) is stored in local storage.",
          "On gift pages, a random session id lets us count an open once per browser without identifying you, and a flag remembers that you already sent a reply so you are not asked twice.",
        ],
      },
      {
        heading: "Analytics and advertising",
        body: ["Eain sets no advertising cookies. We do not currently run analytics. If we add product analytics later, it will be privacy-friendly, described here, and subject to consent where the law requires."],
      },
      {
        heading: "Managing cookies",
        body: ["You can clear cookies and site data in your browser at any time. Clearing them signs you out and resets your language and theme."],
      },
    ],
  },
};
