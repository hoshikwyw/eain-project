# Eain Design Notes

Source: two reference images shared on 2026-09-21. One is a design board with light and dark themes. The other is the splash screen in both themes.
All hex values below are estimated by eye from the images. They are starting points, not final brand values.

## 1. Overall feeling

Soft, storybook, cozy. Rounded shapes, gentle gradients, pastel illustration. Small hearts are used as accents, never as the main element.
The light theme is a blossom daytime scene. The dark theme is a cozy night scene with moon, stars and fireflies.
The dark theme is labelled "Dark Theme (Lovely)", which suggests named themes rather than a plain light/dark switch.

## 2. Brand elements

- **Wordmark:** "Eain" in a soft high-contrast serif. On the splash screen the dot of the "i" is a small pink heart.
- **Logo mark:** two lovebirds facing each other so their bodies suggest a heart. Sits left of the wordmark in the app header.
- **Mascots:** two lovebirds. Light theme uses pink and blue. Dark theme uses pink and purple.
- **House:** small birdhouse-style home with a heart-shaped window. The window glows warm yellow in the dark theme.
- **Splash tagline:** "A little gift, made with love."
- **Splash layout:** house and birds on a blossom branch, wordmark, tagline, single heart, three-dot loader, soft hills with flowers at the bottom.

## 3. Colour tokens (estimated)

### Light theme

| Token | Value | Use |
|---|---|---|
| bg | #FFF8F4 | Page background, warm cream blush |
| surface | #FFFFFF | Cards, sidebar |
| surface-tint | #FFF0EE | Active nav item, soft panels |
| border | #F8DDD9 | Card and input borders |
| primary | #F4506E | Buttons, active states, badges |
| primary-hover | #E03E5E | Button hover |
| primary-soft | #FFE4E8 | Chips, soft button backgrounds |
| text | #2B1F21 | Headings and body, warm near-black |
| text-muted | #8A7477 | Secondary text |
| success | #2E9E6B on #E3F5EC | "Opened" chip |
| responded | #F4506E on #FFE4E8 | "Responded" chip |
| draft | #6B6B6B on #F1EEEE | "Draft" chip |
| accent-blue | #6FA8C9 | Second bird, illustration accent |

### Dark theme ("Lovely")

| Token | Value | Use |
|---|---|---|
| bg | #120E2A | Page background, deep navy purple |
| surface | #1C1640 | Cards, sidebar |
| surface-raised | #251D52 | Active nav item, highlighted tile |
| border | #2F2760 | Card borders |
| primary | #8B5CF6 | Main call-to-action, active nav |
| accent-pink | #EC4899 | Secondary call-to-action, "Open Your Gift", hearts |
| text | #F5F1FF | Headings and body |
| text-muted | #A79FC7 | Secondary text |
| success | #34D399 on translucent green | "Opened" chip |
| glow | #FCD9A8 | Moon, heart window, fireflies |

Implementation rule: components use semantic tokens only, never raw hex. Swapping a palette must be a one-file change.

## 4. Typography

- **Display:** soft serif for the wordmark and gift headings such as "A special gift just for you". Proposed font: Fraunces.
- **Interface:** rounded geometric sans for everything else. Proposed font: Plus Jakarta Sans.
- **Burmese:** Noto Sans Myanmar for the interface and Noto Serif Myanmar for gift headings. Unicode only, no Zawgyi.
- Burmese script needs taller line height than Latin, about 1.8 for body text. Stacked glyphs clip at tight line heights.
- Load fonts with unicode-range subsets so the Burmese files download only when Burmese text is on the page.

## 5. Shape, depth, motion

- Card radius about 16px. Buttons and inputs about 10 to 12px. Chips are full pills.
- Shadows are soft, wide and slightly pink-tinted in light theme. Dark theme uses borders and faint glow instead of shadows.
- Motion is gentle: floating petals, twinkling stars, fade and rise. Respect the reduced-motion setting and keep animation cheap for low-end phones.

## 6. Screens shown in the board

### Creator dashboard (desktop)

- **Sidebar:** Dashboard, My Gifts, Templates, Occasions, Points with balance badge, Notifications with count badge, Settings. User card with avatar, name and email at the bottom.
- **Header:** "Welcome back, Aline!" with a heart, subtitle "Create, share and make someone's day extra special.", and a "+ Create New Gift" button.
- **Stat tiles:** Gifts Created, Opened, Responses, Points Balance. Dark theme adds a small icon per tile.
- **Recent Gifts:** thumbnail, title, "For: name", created time, status chip, and Opened and Response counts. "View all" link.
- **Points & Rewards panel:** balance, encouragement line, bird mascot, "How to earn points" list, "View All Rewards" button.
- Earn rules shown: create a gift +20, someone opens +10, receive a response +20, invite a friend +30.

### Public gift view

- Serif heading "A special gift just for you" with a heart.
- Greeting "Happy Birthday, Sarah!" and a short message.
- Two birds on a branch, petals in light theme, moon and string lights in dark theme.
- One clear button: "Open Your Gift".

### Mobile screens

- **My Gifts:** filter tabs All, Opened, Responded, Drafts. Compact gift rows with status chips.
- **Create Gift:** "Choose a Template", search box, category chips, two-column template grid.
- **Points:** balance card with mascot, then "Recent Activity" list with point amounts.
- **Bottom navigation:** five items with a raised round "+" in the centre.
- The board calls these "Mobile App". For V1 they are the responsive mobile web layout, since the spec says no native app yet.

### Components

Primary button, outlined secondary button, text input, select, chips with a selected state and an overflow chip, basic card, and a notification card reading "Someone opened your gift" with a timestamp and mascot.

### Feature row

Beautiful Templates, Easy Sharing, Interactive Experience, Track & Connect. Good source for the landing page feature section.

## 7. Differences between the images and the written spec

| Topic | Spec says | Images show | Proposed handling |
|---|---|---|---|
| Palette | Soft green, cream, dark green. Avoid overly pink. | Coral pink light theme, purple dark theme | Needs a decision. See PLAN.md. |
| Logo | Green house outline with lovebirds | Pink lovebirds forming a heart, pink or purple house | Follows the palette decision |
| Tagline | "Digital gifts that feel like home." | "A little gift, made with love." | Needs a decision |
| Open counts | Do not show creators raw open counts | Rows show "Opened 1" and "Opened 2" | Show recipients who opened, never raw view counts |
| Earning points | Only a welcome bonus is described for launch | Earn for create, open, response, invite | Earn rules with caps in V1, referral later |
| Occasions | Not in spec | Sidebar item | Treat as browse-by-category |
| Mobile app | Web first | "Mobile App" screens | Responsive web layouts |

## 8. Assets still needed

The illustrations carry most of the brand. To build these screens faithfully the project needs exportable files:

- Logo mark and wordmark as SVG.
- Lovebirds in a few poses, transparent background, light and dark variants.
- House with heart window, light and dark variants.
- Splash and gift-reveal background scenes, or the layers to compose them.

If the reference images were AI-generated, these need to be produced or redrawn before the polish milestone. Until then the build uses simple placeholder SVGs.
