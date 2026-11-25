# Eain Launch Checklist

Zero-cost first launch on Vercel Hobby and Supabase Free. Work through the sections in order. Tick each line as you go. The click-by-click version, with what you should see at each step, is [LAUNCH-GUIDE.md](LAUNCH-GUIDE.md).

Costs, at about 4,900 MMK to the dollar: about 6,500 MMK a month (the domain) while nothing is sold, about 240,000 MMK a month from the first sale (Vercel Pro, Supabase Pro, domain, card or agent fees). Vercel and Supabase bill in dollars by card, so arrange a dollar card before the first sale.

## 1. Supabase, before deploying

- [ ] All migrations applied (`supabase/migrations/0001` to `0030`). Check in SQL editor: `select version, name from supabase_migrations.schema_migrations order by version;` (files pasted by hand do not appear there; check one of their changes instead, for 0023: `select slug, paid_only, price_mmk from public.templates where paid_only;` lists the wedding and engagement invitations).
- [ ] Migrations go in **before** the code that needs them. The template picker and template pages read `paid_only` and `price_mmk` from 0023 and fail to load without them; saving an invitation needs 0022; saving a template in `/admin/templates` needs 0024; the ahlu and shinbyu invitations appear once 0025 is in, and the Valentine template once 0026 is in; 0027 prices the remaining premium templates in kyat, and 0028 retires points (no welcome bonus, nothing earned) to match the app, which no longer shows them; the buy page's "I've paid" form and `/admin/payments` need 0029, and admin alerts for new payments need 0030.
- [ ] Authentication → Sign In / Providers → Email: Confirm email is your choice (ON in production). The free mailer sends only a few emails per hour.
- [ ] Authentication → Sign In / Providers → Google: enabled with the Client ID and secret from Google Cloud, the Client ID also in Authorized Client IDs, and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` set in Vercel.
- [ ] Authentication → URL Configuration: Site URL set to the production URL (email links are built from it), and Redirect URLs contain `https://<your-domain>/**` (keep `http://localhost:5173/**` for development). Only links from the older `{{ .ConfirmationURL }}` templates depend on the allow-list.
- [ ] Authentication → Emails → SMTP Settings: custom SMTP on (a free Brevo account with a verified sender is enough; steps in SETUP.md, "Email links"). Without it, the templates below cannot be edited.
- [ ] Authentication → Emails → Templates: the Confirm signup and Reset password templates link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` and `…&type=recovery` (exact templates in SETUP.md, "Email links"), so the links open on our domain and work on any device. The free mailer sends only a few emails per hour; Eain limits reset requests to 3 per device per hour.
- [ ] Your own account promoted to admin: `update public.profiles set role = 'admin' where id = '<your-user-id>';`
- [ ] Storage → gift-media bucket exists and is **private** (created by migration 0004).
- [ ] Settings → API: copy the URL, anon key and service role key for Vercel.

## 2. Google Cloud

- [ ] OAuth consent screen filled in. While in "Testing", only listed test users can sign in; publish it before inviting others.
- [ ] OAuth client: Authorized JavaScript origins include the production URL; Authorized redirect URI is `https://<project-ref>.supabase.co/auth/v1/callback`.

## 3. Vercel

- [ ] Repository pushed to GitHub and imported in Vercel. Framework: Next.js. Install command `pnpm install`, build command `pnpm build`.
- [ ] Environment variables (Production and Preview):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server only, never prefixed with NEXT_PUBLIC)
  - `NEXT_PUBLIC_SITE_URL` = the production URL, no trailing slash
  - `CRON_SECRET` = a long random string (`openssl rand -base64 32`)
  - `NEXT_PUBLIC_CONTACT_EMAIL` (optional)
  - `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` (optional; leave unset to keep analytics off)
  - `EAIN_PAY_NAME`, `EAIN_PAY_KBZPAY`, `EAIN_PAY_WAVEPAY`, `EAIN_SALES_CONTACT_URL` (server only; where customers pay for paid templates, shown on `/dashboard/buy/<template>`. With no wallet number the page says buying opens soon. The contact link must be https: m.me, Viber or t.me)
- [ ] First deploy succeeds. Open the URL on a phone.
- [ ] After every later deploy, a tab that was already open may show "A newer Eain is live" once and reload itself: that is the stale-page recovery (`lib/stale-page.ts`), not a bug. Vercel's Skew Protection would avoid even that, but it is Pro-only.
- [ ] Cron: Settings → Cron Jobs shows `/api/cron/keepalive` daily. Trigger it once and confirm `{ "ok": true }` in the logs. This keeps the free Supabase project from pausing.
- [ ] Hobby plan is for non-commercial use. Payments are off, so this is fine for the validation launch. Move to Pro before real payments.

## 4. Smoke test on production

Run through with two devices, or one browser plus a private window.

- [ ] Sign up with email. The dashboard opens, with no points anywhere (retired in 0028).
- [ ] Sign in with Google on a second account.
- [ ] Create a gift from Birthday Postcard, add a photo, add a question, save, publish.
- [ ] Copy the link and open it in the private window. Tap "Open your gift". Answer the question.
- [ ] Back on the dashboard: gift shows Opened, timeline has times, Responses shows the answer, Notifications has two entries.
- [ ] Share the link into a Messenger or Viber chat to yourself. The preview shows the generic text and the Eain image, never the message. Opening from the chat still shows "Not opened" until the button is tapped.
- [ ] Regenerate the link. Old link shows "not available". Delete the gift. New link shows "not available".
- [ ] Open the Wedding Invitation in the picker: it shows its kyat price and "How to buy", never an unlock button. The buy page shows your wallet numbers and contact link.
- [ ] As the second account, open the Wedding Invitation's buy page and press **I've paid** with KBZPay and `1234`. The page then says the payment is being checked.
- [ ] As admin, open `/admin/payments`: the payment waits there with the amount, wallet and digits. Approve it. The second account gets a notification that opens the template, and the audit log has `approve_payment`. Try a reject too, with a reason: the customer sees the reason.
- [ ] Report a gift from the public page. In /admin/reports it appears. Take it offline; owner gets a notification; audit log has the entry.
- [ ] Switch to Burmese on a phone. Check line heights on the gift page and the editor.
- [ ] Turn on airplane-mode throttling in DevTools (Slow 3G). The gift page reaches "Open your gift" in under a few seconds and images load lazily.
- [ ] From a Myanmar connection without VPN: sign up with email and confirm from the email, sign in with Google, reset a password, open a gift with a photo. In DevTools, Network, no request goes to `*.supabase.co`.

## 5. Automated checks against production

The tests make throwaway users and gifts in the database they are given, then open the site as those users. Production has its own Supabase project, so for this run every value points at production. Step by step in [LAUNCH-GUIDE.md](LAUNCH-GUIDE.md), part 6.

```
# .env.local, only for this run, then delete it
NEXT_PUBLIC_SUPABASE_URL=https://<production-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production anon key>
SUPABASE_SERVICE_ROLE_KEY=<production service role key>
NEXT_PUBLIC_SITE_URL=https://<your-domain>
```

```
pnpm test:reachability
pnpm test:email-links
pnpm test:core
pnpm test:responses
pnpm test:rls
```

The reachability test is the one that matters most: it proves the deployed pages never send the browser to the Supabase host, which is blocked on some networks in Myanmar. Leave out `test:account` and `test:admin*` here: they edit templates and roles. Delete `.env.local` straight after, or `pnpm dev` and every later test run would use the production database. If a run was interrupted, remove leftover `@example.com` users under Authentication, Users.

## 6. Legal and content

- [ ] Privacy, Terms, Security and Cookie pages reviewed by a lawyer familiar with Myanmar and with where users may be. Remove the draft notice in `messages/*.json` (`legal.draftNotice`) only after that review, and set the `updated` dates in `content/legal/*.ts`.
- [ ] Retention periods decided and written into the Privacy page.
- [ ] Contact email decided and set in `NEXT_PUBLIC_CONTACT_EMAIL`.

## 7. Before the first sale

The closed test can run without these. The first kyat taken needs all of them.

- [ ] Vercel moved to Pro (the Hobby plan is non-commercial only).
- [x] Terms and Privacy cover paid templates (2026-11-25, both languages): price in kyat before paying, unlock within a few hours, full refund if not unlocked within 24 hours or broken and not fixed within 7 days, never a wallet PIN. The buy page links to it. A lawyer reviews it with the rest (section 6).
- [ ] Wallet numbers and the contact link set in Vercel (section 3). Send a test payment to yourself and read the buy page on a phone.

**Selling a template.** The customer pays by KBZPay or WavePay, then on the buy page presses **I've paid** with the wallet and the last digits of the transaction. It waits in `/admin/payments`. Open your wallet app, find that amount with those digits, and press **Approve**: the template unlocks and the customer is told. If you cannot find it, press **Reject** with a reason ("No such payment in WavePay"); the customer sees it and can send again. Check the wallet app itself, never only a screenshot. Every decision is in the audit log. For a sale that came through Messenger or a partner, you can still give a template from the buyer's page in `/admin/users`. Prices are set on each template's page in `/admin/templates`.

## 8. Monitoring, weekly

- [ ] Supabase → Usage: database size, storage, egress. Storage (1 GB) and egress (5 GB/month) are the first limits to reach.
- [ ] Vercel → Usage: bandwidth, function invocations, image optimisation (should stay near zero; Eain bypasses it).
- [ ] `/admin` overview: open reports, published gifts in the last 7 days. Published gifts per week is the one number that matters most, then paid templates sold (the Recent decisions list in `/admin/payments`). Clear the waiting list at least twice a day.
- [ ] Rotate `CRON_SECRET` and the Supabase service role key if they were ever pasted anywhere unsafe.

## 9. Known gaps for after launch

Done since the first version of this list: account self-deletion and the daily cleanup of deleted gifts' photos (the keepalive cron). Points were retired on 2026-11-25: every premium template is sold in kyat.

- Payment straight from KBZPay or WavePay, server-verified, once about 50 sales have gone through by hand.
- Ahlu, shinbyu and kathina invitation templates.
- Email or push notifications.
- Per-recipient links (`/r/token`) for multiple recipients.
- Night garden: one `<svg>` per plant with compositor transforms, after a real-phone check.
