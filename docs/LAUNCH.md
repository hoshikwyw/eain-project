# Eain Launch Checklist

Zero-cost first launch on Vercel Hobby and Supabase Free. Work through the sections in order. Tick each line as you go.

## 1. Supabase, before deploying

- [ ] All migrations applied (`supabase/migrations/0001` to `0009`). Check in SQL editor: `select version, name from supabase_migrations.schema_migrations order by version;`
- [ ] Authentication → Sign In / Providers → Email: **Confirm email OFF**. The free mailer sends only a few emails per hour.
- [ ] Authentication → Sign In / Providers → Google: enabled with the Client ID and secret from Google Cloud.
- [ ] Authentication → URL Configuration: Site URL set to the production URL, and Redirect URLs contain `https://<your-domain>/auth/callback` (keep the localhost one for development).
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
- [ ] First deploy succeeds. Open the URL on a phone.
- [ ] Cron: Settings → Cron Jobs shows `/api/cron/keepalive` daily. Trigger it once and confirm `{ "ok": true }` in the logs. This keeps the free Supabase project from pausing.
- [ ] Hobby plan is for non-commercial use. Payments are off, so this is fine for the validation launch. Move to Pro before real payments.

## 4. Smoke test on production

Run through with two devices, or one browser plus a private window.

- [ ] Sign up with email. Dashboard opens with 100 points.
- [ ] Sign in with Google on a second account.
- [ ] Create a gift from Birthday Postcard, add a photo, add a question, save, publish.
- [ ] Copy the link and open it in the private window. Tap "Open your gift". Answer the question.
- [ ] Back on the dashboard: gift shows Opened, timeline has times, Responses shows the answer, Notifications has two entries, points went up by 20 + 10 + 20.
- [ ] Share the link into a Messenger or Viber chat to yourself. The preview shows the generic text and the Eain image, never the message. Opening from the chat still shows "Not opened" until the button is tapped.
- [ ] Regenerate the link. Old link shows "not available". Delete the gift. New link shows "not available".
- [ ] Report a gift from the public page. In /admin/reports it appears. Take it offline; owner gets a notification; audit log has the entry.
- [ ] Switch to Burmese on a phone. Check line heights on the gift page and the editor.
- [ ] Turn on airplane-mode throttling in DevTools (Slow 3G). The gift page reaches "Open your gift" in under a few seconds and images load lazily.

## 5. Automated checks against production

Point the tests at production once, then reset the values to local:

```
# in .env.local temporarily
NEXT_PUBLIC_SITE_URL=https://<your-domain>
pnpm test:rls
pnpm test:core
pnpm test:responses
```

The RLS test uses the same Supabase project either way. The core and responses tests need `NEXT_PUBLIC_SITE_URL` to point at the deployed site. They create and delete throwaway users.

## 6. Legal and content

- [ ] Privacy, Terms, Security and Cookie pages reviewed by a lawyer familiar with Myanmar and with where users may be. Remove the draft notice in `messages/*.json` (`legal.draftNotice`) only after that review, and set the `updated` dates in `content/legal/*.ts`.
- [ ] Retention periods decided and written into the Privacy page.
- [ ] Contact email decided and set in `NEXT_PUBLIC_CONTACT_EMAIL`.

## 7. Monitoring, weekly

- [ ] Supabase → Usage: database size, storage, egress. Storage (1 GB) and egress (5 GB/month) are the first limits to reach.
- [ ] Vercel → Usage: bandwidth, function invocations, image optimisation (should stay near zero; Eain bypasses it).
- [ ] `/admin` overview: open reports, published gifts in the last 7 days. Published gifts per week is the one number that matters most.
- [ ] Rotate `CRON_SECRET` and the Supabase service role key if they were ever pasted anywhere unsafe.

## 8. Known gaps for after launch

- Daily caps on earned points.
- Real point purchases with a Myanmar payment provider, server-verified.
- Account self-deletion and the scheduled cleanup of deleted gifts' photos.
- Email or push notifications.
- Per-recipient links (`/r/token`) for multiple recipients.
