# Eain Build Plan

Status on 2026-09-21: planning only. The project folder holds documents and no code.
Inputs: the master specification pasted in chat, the launch cost strategy, and two design reference images. Design details live in DESIGN_NOTES.md.

The pasted specification was cut off at the 50,000 character limit, inside "Free-tier safety limits" of the cost strategy. Anything after that point has not been read. Please save the full text as docs/SPEC.md.

## 1. Decisions needed from the owner

Each item has a default. Work proceeds on the default unless changed.

| # | Question | Default |
|---|---|---|
| 1 | Palette. The spec asks for green and cream and warns against too much pink. The images are coral pink and purple. | Follow the images, since they are the newer and more detailed source. All colours go through semantic tokens so a change is one file. Gift templates carry their own palettes, so gifts are not all pink. |
| 2 | Tagline. "Digital gifts that feel like home." or "A little gift, made with love." | Use the spec line on the landing page and the image line on the splash and gift reveal. |
| 3 | Sign-in methods. The built-in Supabase email sender allows only a couple of emails per hour, and the launch has no custom domain for a mail provider. | Google sign-in plus email and password with email confirmation turned off. Facebook sign-in later, because it needs business verification. |
| 4 | Development database. The local Supabase stack needs Docker Desktop. | Use two hosted free projects, one for development and one for production. Migrations stay in the repository either way. |
| 5 | Illustration assets. The birds, house and scenes need exportable files. | Build with placeholder SVGs. Real assets arrive before the polish milestone. |
| 6 | Earning points for activity, as shown in the images. | Include create, open and response rewards with daily caps. Leave "invite a friend" for later because it needs a referral system. |

## 2. Architecture decisions

**Stack.** Next.js App Router, strict TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, React Hook Form, Zod, next-intl, Supabase, pnpm. Zustand only for editor state. TanStack Query only where the dashboard needs client refetching.

**Receiver access.** The anonymous database role gets no table policies at all. Every receiver action goes through Next.js server code that looks up the token and returns only gift content. The service-role key lives in one server-only module and never reaches the browser.

**Atomic writes in the database.** Publishing, submitting a response and spending points each run as one Postgres function. This keeps the ledger, events and notifications consistent.

**Links.** Every publish creates one default recipient row, so gifts and recipients are separate from day one. V1 shares the gift link at /g/token. The /r/token route is reserved for per-recipient links when multiple recipients arrive. Tokens are 32 random bytes, base64url encoded, generated with the platform crypto API. Regenerating a link replaces the token and the old one stops working.

**Open tracking that link previews cannot fake.** Messenger, Viber and Telegram fetch a link to build a preview. If the page load counted as an open, creators would see false "Opened" states. So the page load records nothing visible to the creator. "Opened" is recorded when the receiver taps "Open Your Gift". "Viewed" is recorded when they reach the end of the content.

**Link privacy.** Gift pages are marked no-index and send no referrer. The social preview is generic: "Someone made something special for you." It never includes the message, names or photos.

**Sessions without fingerprinting.** A random session id is stored in the browser for de-duplicating events. No IP address is stored with events. Rate limiting uses a salted hash of the IP with a salt that rotates daily, kept in a short-lived table.

**Rate limiting at zero cost.** A small Postgres counter table and function. No extra vendor.

**Gift content.** A gift has ordered sections. Each section has a type and a JSON body validated by a Zod schema for that type. All user text renders as plain text through React. No raw HTML and no clickable user links in V1, which also blocks scam links.

**Templates.** Visual templates are React components in the codebase. The templates table holds metadata: slug, category, gift type, preview, free or premium, point price, default sections and default theme. Admins manage metadata, not layout code.

**Images.** The browser resizes to a maximum of 1600 pixels, converts to WebP near 1 MB, and makes a 400 pixel thumbnail before upload. The server checks file signature bytes, size, dimensions and per-gift count, then issues a signed upload URL into a private bucket. Gift pages receive signed URLs valid for one hour. Supabase image transformation and Vercel image optimisation are both avoided, because both are limited or paid.

**Points.** A ledger table is the source of truth. The cached balance on the profile changes only inside the ledger function. Users have no update right on the balance. A separate unlocks table records which premium templates a user owns.

**Languages.** English and Burmese from the first commit through next-intl. No hard-coded strings in components.

**Themes.** Light and "Lovely" dark through CSS variables. The choice follows the system setting and can be overridden.

## 3. Data model

Tables from the spec: profiles, templates, gifts, gift_sections, gift_media, gift_recipients, gift_questions, gift_question_options, gift_responses, gift_answers, gift_events, notifications, point_transactions, payments.

Tables added by this plan:

- **categories** for the fourteen gift categories and the Occasions screen.
- **template_unlocks** for premium templates a user has bought with points.
- **reports** for "Report this gift".
- **admin_audit_logs** for administrator actions.
- **rate_limits** for the counter described above.

Access summary, following the ten questions the spec asks of every table:

| Table | Owner | Creator can | Public can | Personal data | Retention |
|---|---|---|---|---|---|
| profiles | User | Read and edit own, except role and balance | Nothing | Yes | Until account deletion |
| templates, categories | Eain | Read active rows | Read active rows | No | Indefinite |
| gifts, gift_sections, gift_questions, options | Creator | Full control of own | Content only, through token on the server | Yes | Until deleted, then grace period |
| gift_media | Creator | Full control of own | Signed URLs only, through token | Yes | Deleted with gift |
| gift_recipients | Creator | Full control of own | Nothing | Yes, optional contact fields | Deleted with gift |
| gift_events | Creator, written by server | Read own | Insert through server only | Minimal | Trim raw events after a set period |
| gift_responses, gift_answers | Creator, written by receiver | Read own | Insert through server only, never read | Yes | Deleted or anonymised with gift |
| notifications | User | Read and mark own | Nothing | Minimal | Trim after a set period |
| point_transactions, template_unlocks | User | Read own | Nothing | No | Kept for audit |
| payments | User | Read own | Nothing | Minimal | Per legal need. Table exists, unused in V1. |
| reports | Eain | Create | Create through server | Possible | Until resolved plus a set period |
| admin_audit_logs | Eain | Nothing | Nothing | Minimal | Long |
| rate_limits | Eain | Nothing | Nothing | Hashed only | Hours |

Every table has row level security enabled. Administrator access is checked through a role column that users cannot edit. Exact retention periods are still to be set before launch.

## 4. Routes

| Area | Routes | Sign-in |
|---|---|---|
| Marketing | /, /templates, /privacy, /terms, /security, /cookies, /report, /contact | No |
| Auth | /auth/login, /auth/signup, /auth/callback | No |
| Create | /create for template choice, /create/giftId for the editor and preview | Yes |
| Dashboard | /dashboard, /dashboard/gifts, /dashboard/gifts/id, /dashboard/notifications, /dashboard/points, /dashboard/settings | Yes |
| Receiver | /g/token, and later /r/token | No |
| Receiver API | POST events, POST responses, POST report, all keyed by token, validated and rate limited | No |
| Admin | /admin with users, templates, points, payments, reports, usage | Admin role |

Browsing templates is open to visitors. Sign-in is asked for only when they start customising, which matches the first-time creator journey in the spec.

## 5. Milestones

The phase order in the spec builds the whole template system before anything can be shared. This plan builds one thin end-to-end slice first, so the core loop is testable early, then widens it. The content of the phases is unchanged.

### M0. Foundation
Scope: git repository, Next.js project, strict TypeScript, lint and format, Tailwind with both theme token sets, fonts including Burmese, next-intl with English and Burmese, base shadcn components restyled to the design, folder structure from the spec, environment variable handling, Supabase projects, first Vercel deploy.
Done when: the deployed site shows a placeholder landing page with working theme and language switches on a phone.

### M1. Accounts, schema, security
Scope: all migrations, row level security on every table, profile creation trigger, welcome points through the ledger, sign up, log in, log out, profile page, protected dashboard shell with sidebar on desktop and bottom navigation on mobile.
Done when: automated tests prove that one creator cannot read or change the gifts, responses, points or notifications of another creator, and that the anonymous role can read nothing.

### M2. Core loop with one template
Scope: Birthday Postcard only. Create draft, edit text and recipient name, preview, publish, copy link, QR code with download, public page with gift reveal, opened event, status on the dashboard. The "anyone with this link can view" notice appears at publish.
Done when: a gift made on one phone can be opened on another phone with no account, and the creator sees "Opened" with the time.

### M3. Editor, photos, templates
Scope: section model with add, remove and reorder, photo upload pipeline with limits, theme and colour options, basic animations, template library with categories and search, the remaining nine templates, duplicate, delete, unpublish, regenerate link, five active gifts limit.
Done when: all ten templates can be created, published and opened on mobile, and every upload limit is enforced on the server.

### M4. Interaction
Scope: question sections for choice, yes or no, short text and reaction, response submission, confirmation screen, soft invitation for the receiver to make their own gift, response view for the creator, activity timeline from events, in-app notifications with the two settings toggles.
Done when: a receiver can answer without an account, the creator is notified, and responses are unreachable from any public route.

### M5. Points and premium
Scope: balance, transaction history, unlock premium templates, capped earn rules, "Buy points, coming soon" screen. Real payments stay off.
Done when: no browser request can change a balance except through a validated spend, and a double-submitted unlock charges once.

### M6. Admin and reports
Scope: report a gift, admin screens for users, templates, points, payments and reports, disable gift, audit log, a usage page listing each free-tier limit with a link to its console.
Done when: a reported gift can be reviewed and disabled, and every admin action appears in the audit log.

### M7. Landing and trust pages
Scope: full landing page per the spec, privacy, terms, security and cookie pages with a plain summary above the full text, footer, SEO metadata.
Done when: all pages exist in both languages. Legal text is marked as draft until a lawyer reviews it.

### M8. Polish and launch
Scope: real illustrations, animation pass, accessibility pass, performance pass on a slow connection, PostHog with a minimal event list, end-to-end test of the core loop, launch checklist.
Done when: the gift page is fast on a mid-range Android phone over 3G and the core loop test passes against production.

## 6. Free-tier risks

| Risk | Handling |
|---|---|
| Supabase storage and egress are the first limits to hit | Browser-side compression, thumbnails, photo and gift limits, lazy loading, one-hour signed URLs |
| Supabase pauses free projects after a week without activity | A daily scheduled request from Vercel keeps it awake |
| Supabase built-in email is limited to a few messages per hour | Sign-in methods that need no email confirmation |
| The Vercel free plan is for non-commercial use | Acceptable while payments are off. Move to a paid plan before real payments. |
| Vercel image optimisation has a small free quota | Serve our own pre-sized images and bypass the optimiser for gift media |
| One user consuming everything | Per-user and per-gift limits, rate limits on every public write |
| Free limits change over time | Re-check current limits at M0 and again before launch |

## 7. Not in V1

Real payments, video, music, the template marketplace, AI features, gift threads, native apps, email and push notifications, PIN or password protected gifts, referral rewards, Facebook sign-in.

## 8. Testing approach

- Unit tests with Vitest for schemas, token generation, limits and point rules.
- Database tests for row level security, run against the development project.
- One Playwright end-to-end test for create, publish, open and respond.
- Manual check on a real Android phone in Burmese at the end of each milestone.

## 9. Next step

Answer the six decisions in section 1, add docs/SPEC.md, then start M0.
