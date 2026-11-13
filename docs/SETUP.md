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

| Part                     | Service                   | Needed for                                 | Cost |
| ------------------------ | ------------------------- | ------------------------------------------ | ---- |
| A. Foundation            | None                      | Landing page, theme, language              | $0   |
| B. Accounts and database | Supabase (hosted, free)   | Sign up, log in, gifts, points             | $0   |
| B. Accounts              | Google Cloud OAuth client | "Continue with Google" button              | $0   |
| C onward                 | Same Supabase project     | Photos (Storage), responses, notifications | $0   |
| Deploy                   | Vercel Hobby              | Public URL such as eain.vercel.app         | $0   |
| Later, optional          | PostHog free tier         | Product analytics                          | $0   |

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

8. Run the tests. They work against this Supabase project and the running dev server, create throwaway users (emails ending in `@example.com`) and delete them at the end. The env values are read from `.env.local`, or from `.env` if that is the file you use.

```
pnpm test              # every test file, one after the other
pnpm test:rls          # no user can reach another user's data
pnpm test:core         # create, publish, open, reply
pnpm test:media        # photo uploads
pnpm test:responses    # replies and questions
pnpm test:styles       # custom colours, text styles and stickers
pnpm test:prelaunch    # password reset pages, the shared step, the daily purge
pnpm test:account      # daily earn cap, deleting an account
pnpm test:admin        # reports and moderation
pnpm test:admin-users  # admin user pages; needs the admin site (pnpm dev:both)
```

If a run is interrupted, `pnpm cleanup:test-users` lists the throwaway users left behind and `pnpm cleanup:test-users --yes` removes them.

The purge check in `test:prelaunch` runs only when `CRON_SECRET` is set, and then it runs the real purge: any gift in this database deleted more than 30 days ago is removed for good. If this database is also your production database, that is what the daily job does anyway, a few hours early.

9. To make yourself an admin later, run in the Supabase SQL editor:

```
update public.profiles set role = 'admin' where id = '<your-user-id>';
```

A second Supabase project for production can be created later with the same steps.

## Part B: Google sign-in (optional but recommended)

The app already contains the button. It is drawn by Google's own sign-in library: the browser gets a token from Google and our server finishes the sign-in with Supabase, so the browser never has to reach the Supabase host (some networks, Myanmar among them, cannot). The login page shows the button only once Supabase reports the provider as enabled and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set.

1. Google Cloud Console (console.cloud.google.com): create a project, then APIs & Services, then OAuth consent screen. Choose External, fill app name "Eain", your support email and developer email. Add test users while the app is in testing mode, or publish it.
2. APIs & Services, then Credentials, then Create credentials, then OAuth client ID, type Web application.
   - Authorized JavaScript origins: `http://localhost:5173`, and every origin the site is served from (the Vercel URL, the admin URL, your own domain). Google's button refuses to work from an origin that is not listed.
   - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`. The exact value is shown in Supabase under Authentication, Sign In / Providers, Google.
3. Copy the Client ID and Client secret into that Supabase Google provider screen, paste the same Client ID into its **Authorized Client IDs** field (that is what lets Supabase accept Google's token), and turn the provider on.
4. Supabase, Authentication, URL Configuration: Site URL `http://localhost:5173`, and Redirect URLs must include `http://localhost:5173/auth/callback`. Without this, Supabase sends users back to the wrong address after Google.
5. Put the Client ID in `.env.local` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, and in the Vercel project settings.
6. Reload the login page. The Google button appears within five minutes, or immediately after restarting `pnpm dev`.

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
