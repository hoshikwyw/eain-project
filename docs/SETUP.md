# Eain Local Setup

## Run the site

```
pnpm install
pnpm dev
```

The site opens at http://localhost:5173. Port 5173 is set in the `dev` script in package.json.

Other scripts: `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm build`.

## Services by part

Everything is free tier. Nothing is paid.

| Part | Service | Needed for | Cost |
|---|---|---|---|
| A. Foundation | None | Landing page, theme, language | $0 |
| B. Accounts and database | Supabase (hosted, free) | Sign up, log in, gifts, points | $0 |
| B. Accounts | Google Cloud OAuth client | "Continue with Google" button | $0 |
| C onward | Same Supabase project | Photos (Storage), responses, notifications | $0 |
| Deploy | Vercel Hobby | Public URL such as eain.vercel.app | $0 |
| Later, optional | PostHog free tier | Product analytics | $0 |

Not needed: Docker, a custom domain, an email provider, a payment provider.

## Part B: Supabase setup (do this before Part B starts)

1. Create an account at supabase.com and a new project. Region: Singapore is closest to Myanmar.
2. Save the database password somewhere safe. It is shown once.
3. In the project, open Settings, then API. Copy three values into `.env.local` (copy `.env.example` first):
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (server only, never sent to the browser)
4. In Authentication, then Providers, then Email: turn **off** "Confirm email". The free built-in mailer allows only a few emails per hour, so V1 does not depend on it.
5. In Authentication, then URL Configuration: set Site URL to `http://localhost:5173` and add `http://localhost:5173/auth/callback` to Redirect URLs. Add the Vercel URL later.
6. Migrations in `supabase/migrations` are applied with the Supabase CLI (`pnpm dlx supabase db push`) linked to the project. The CLI needs a personal access token from your Supabase account page. No Docker is needed for `db push`.

A second Supabase project for production can be created later with the same steps.

## Part B: Google sign-in (optional but recommended)

1. In Google Cloud Console create a project and an OAuth 2.0 Client ID of type Web application.
2. Authorized redirect URI: the callback URL shown in Supabase under Authentication, Providers, Google. It looks like `https://xxxx.supabase.co/auth/v1/callback`.
3. Paste the Client ID and Client Secret into that Supabase Google provider screen and enable it.

Facebook sign-in is deferred. It needs Meta business verification.

## Deploy to Vercel (any time after Part A)

1. Push the repository to GitHub.
2. Import it at vercel.com. Framework is detected as Next.js. Build command `pnpm build`.
3. Add the same environment variables from `.env.local` in the Vercel project settings once Part B exists.
4. The Hobby plan is for non-commercial use. It is fine while payments are switched off.

## Free-tier limits to watch

Check the Supabase dashboard Usage page and the Vercel Usage page. The first limits reached are usually Supabase Storage (1 GB) and egress (5 GB per month). Supabase pauses free projects after seven days without requests; a daily scheduled request from Vercel keeps it awake once deployed.
