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
6. Apply the migrations in `supabase/migrations` with the Supabase CLI. No Docker is needed for these commands:

```
pnpm dlx supabase login
pnpm dlx supabase link --project-ref <your-project-ref>
pnpm dlx supabase db push
```

   The project ref is the part before `.supabase.co` in the project URL. Login opens the browser for a personal access token.

   **If the CLI cannot reach the database** (the direct host is IPv6 only, and some networks also block the pooler), run the migrations by hand instead: `powershell -File scripts/combine-migrations.ps1` writes `supabase/ALL_MIGRATIONS.sql`. Paste that file into the Supabase SQL editor and run it once on an empty project. It records the versions, so a later `db push` skips them. For a new migration added afterwards, paste only that file's contents.

7. Restart `pnpm dev` so the new `.env.local` is read. Sign up at http://localhost:5173/auth/signup. The new profile receives 100 welcome points.

8. Run the security tests, which create two throwaway users and check that neither can reach the other's data, and the core loop test, which needs the dev server running:

```
pnpm test:rls
pnpm test:core
pnpm test:media
pnpm test:responses
```

9. To make yourself an admin later, run in the Supabase SQL editor:

```
update public.profiles set role = 'admin' where id = '<your-user-id>';
```

A second Supabase project for production can be created later with the same steps.

## Part B: Google sign-in (optional but recommended)

The app already contains the button and the callback route. The login page shows the Google button only once Supabase reports the provider as enabled.

1. Google Cloud Console (console.cloud.google.com): create a project, then APIs & Services, then OAuth consent screen. Choose External, fill app name "Eain", your support email and developer email. Add test users while the app is in testing mode, or publish it.
2. APIs & Services, then Credentials, then Create credentials, then OAuth client ID, type Web application.
   - Authorized JavaScript origins: `http://localhost:5173` (add the Vercel URL later).
   - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`. The exact value is shown in Supabase under Authentication, Sign In / Providers, Google.
3. Copy the Client ID and Client secret into that Supabase Google provider screen and turn the provider on.
4. Supabase, Authentication, URL Configuration: Site URL `http://localhost:5173`, and Redirect URLs must include `http://localhost:5173/auth/callback`. Without this, Supabase sends users back to the wrong address after Google.
5. Reload the login page. The Google button appears within five minutes, or immediately after restarting `pnpm dev`.

A Google sign-up creates the profile through the same trigger as email sign-up, using the Google name and picture, and grants the welcome points.

Facebook sign-in is deferred. It needs Meta business verification.

## Deploy to Vercel

The full pre-launch list, including Supabase settings, environment variables, the keep-alive cron and the production smoke test, is in [LAUNCH.md](LAUNCH.md). Short version:

1. Push the repository to GitHub.
2. Import it at vercel.com. Framework is detected as Next.js. Build command `pnpm build`.
3. Add the same environment variables from `.env.local` in the Vercel project settings once Part B exists.
4. The Hobby plan is for non-commercial use. It is fine while payments are switched off.

## Free-tier limits to watch

Check the Supabase dashboard Usage page and the Vercel Usage page. The first limits reached are usually Supabase Storage (1 GB) and egress (5 GB per month). Supabase pauses free projects after seven days without requests; a daily scheduled request from Vercel keeps it awake once deployed.
