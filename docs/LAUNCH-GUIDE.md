# Eain Launch Guide, Step by Step

This guide takes Eain from your computer to a live site for the closed test. Follow the parts in order. Each step says what to click and what you should see. [LAUNCH.md](LAUNCH.md) is the checklist; this is the how-to.

**Time:** about two hours, in one sitting or spread over a few days.
**Cost:** 0 MMK. Everything here is free until the first sale.

## The plan in one picture

| Part | Where         | What you get                                                      |
| ---- | ------------- | ----------------------------------------------------------------- |
| 1    | Supabase      | A new, empty production database with all 25 migrations           |
| 2    | Vercel        | The live site at a free address such as `eain-project.vercel.app` |
| 3    | Supabase      | Sign-in emails that work in Myanmar (Brevo)                       |
| 4    | Google Cloud  | The "Continue with Google" button                                 |
| 5    | The live site | Your own admin account                                            |
| 6    | Your phone    | The smoke test, including a Myanmar connection without VPN        |
| 7    | Later         | Your own domain, before the public launch                         |
| 8    | Later         | Before the first sale                                             |

**Why no domain yet:** the closed test works on the free Vercel address, and every step below can be redone for a domain later (part 7). That keeps the first launch at 0 MMK and removes the dollar card from the critical path.

**Keep a notes file open** (Notepad is fine, outside the project folder) to paste values into as you go: the Supabase keys, the Vercel address, the Google client ID, the Brevo key. Never paste the service role key, database password or SMTP key into chat, email or the project folder.

---

## Part 1. The production database (Supabase)

Use a **new** project for production. Your current project (`ljtdeixurhaexzmgbiuz`) stays for development and tests, because the tests create and delete users there.

### 1.1 Create the project

1. Go to https://supabase.com/dashboard and click **New project**.
2. Organization: your own. Name: `eain-production`.
3. **Database password:** click **Generate a password**, then copy it into your notes file. It is shown once.
4. **Region:** Southeast Asia (Singapore). It is closest to Myanmar.
5. Click **Create new project**. Wait about two minutes until the dashboard stops saying "Setting up".

### 1.2 Copy the three keys

1. In the left sidebar, click the gear icon **Project Settings**, then **API** (or **Data API** and **API Keys**, depending on the dashboard version).
2. Copy into your notes file:
   - **Project URL**, for example `https://abcd1234.supabase.co`. The part before `.supabase.co` is the **project ref**.
   - **anon public** key.
   - **service_role** key (click Reveal). This one is secret.

### 1.3 Put all migrations in, in one paste

1. On your computer, in the project folder, open a terminal (in VS Code: **Terminal**, then **New Terminal**) and run:
   ```
   powershell -File scripts/combine-migrations.ps1
   ```
   It writes `supabase/ALL_MIGRATIONS.sql` with migrations 0001 to 0025 in one file.
2. Open `supabase/ALL_MIGRATIONS.sql` in VS Code, press **Ctrl + A**, then **Ctrl + C**.
3. In Supabase, left sidebar, **SQL Editor**, then **+ New query**. Paste with **Ctrl + V**. Click **Run**. If it warns about destructive operations, click **Run this query**.
4. **You should see:** "Success. No rows returned." It can take up to a minute.
5. Check it, in a new query:
   ```sql
   select count(*) as templates from public.templates;
   select slug, paid_only, price_mmk from public.templates where paid_only;
   ```
   You should see about 22 templates, then four paid-only ones: the wedding invitation (35000), the engagement party (25000), ahlu (10000) and shinbyu (15000).
6. Left sidebar, **Storage**. A bucket named `gift-media` exists and shows **Private**.

`supabase/ALL_MIGRATIONS.sql` is generated; you can delete it afterwards. Do not run it twice on the same project.

**If you see a red error:** copy the whole message. Nothing is half-applied: the file runs as one transaction, so an error means nothing changed. Send the message and fix before going on.

### 1.4 Sign-in settings (part one)

1. Left sidebar, **Authentication**, then **Sign In / Providers**, then **Email**.
2. **Enable Email provider:** on. **Confirm email:** on. Save.
3. Leave the rest of Authentication for part 3, once the site has an address.

---

## Part 2. The live site (Vercel)

### 2.1 Import the repository

1. Go to https://vercel.com and sign in with GitHub (the same account that owns `eain-project`).
2. Click **Add New...**, then **Project**. Find `eain-project` and click **Import**.
3. **Framework Preset:** Next.js (detected). **Root Directory:** leave as is. **Build Command:** `pnpm build`. **Install Command:** `pnpm install`.
4. Do not click Deploy yet. Open **Environment Variables** first.

### 2.2 Environment variables

Add each line below with **Add**. Leave the environment as **Production and Preview** (the default).

| Name                            | Value                                                                 |
| ------------------------------- | --------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Production Project URL from 1.2                                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production anon key from 1.2                                          |
| `SUPABASE_SERVICE_ROLE_KEY`     | Production service_role key from 1.2                                  |
| `NEXT_PUBLIC_SITE_URL`          | `https://eain-project.vercel.app` for now; corrected in 2.4           |
| `CRON_SECRET`                   | A long random string (see below)                                      |
| `NEXT_PUBLIC_CONTACT_EMAIL`     | The address customers write to, for example a Gmail you made for Eain |

To make the `CRON_SECRET` string, run this in the VS Code terminal and copy the output:

```
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

**Leave these out for now:** `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (part 4), the four `EAIN_PAY_*` and `EAIN_SALES_CONTACT_URL` (part 8), `NEXT_PUBLIC_POSTHOG_*`, `GOOGLE_SITE_VERIFICATION`. Also leave out `EAIN_APP_MODE` and `NEXT_PUBLIC_ADMIN_SITE_URL`: production runs as one site, with the admin console at `/admin`.

### 2.3 Deploy

1. Click **Deploy**. The build takes about three minutes.
2. **You should see:** "Congratulations!" and a preview. Click **Continue to Dashboard**.
3. The **Domains** box shows the address, for example `eain-project.vercel.app` or `eain-project-xyz.vercel.app`. Copy it into your notes.

**If the build fails:** open the build log, scroll to the first red line, and send it. The same code builds locally, so the usual cause is a missing or mistyped variable.

### 2.4 Fix the site address

1. If the address in 2.3 is not exactly what you put in `NEXT_PUBLIC_SITE_URL`: **Settings**, **Environment Variables**, edit `NEXT_PUBLIC_SITE_URL` to `https://` plus the address, no slash at the end.
2. **Deployments** tab, the three dots on the newest one, **Redeploy**. Variables only take effect after a redeploy.

### 2.5 The daily keep-alive job

1. **Settings**, **Cron Jobs**. You should see `/api/cron/keepalive`, daily.
2. Click **Run** once. Then **Logs** (top menu): the request shows status 200 and `{"ok":true,...}`.

This job keeps the free Supabase project from pausing after a quiet week, and removes deleted gifts' photos after 30 days.

### 2.6 First look

Open the address on your phone. The home page, `/templates` and a template page load in English and Burmese. Sign-up does not work properly until part 3.

---

## Part 3. Sign-in emails that reach Myanmar (Brevo and Supabase)

Supabase's own mailer links to `*.supabase.co`, which times out in Myanmar, and it sends only a few emails an hour. Brevo is free (300 emails a day) and lets the links open on the Eain site.

### 3.1 Brevo

1. Go to https://www.brevo.com and create a free account.
2. **Senders, Domains & Dedicated IPs** (under the account menu, top right), then **Senders**, **Add a sender**. Name: `Eain`. Email: the Gmail you made for Eain. Brevo emails a code; enter it.
3. **SMTP & API**, tab **SMTP**, **Generate a new SMTP key**. Name it `supabase-production`. Copy the key into your notes. Also copy the **Login** shown on that page.

### 3.2 Supabase SMTP

In the **production** project:

1. **Authentication**, **Emails**, tab **SMTP Settings**. Turn on **Enable Custom SMTP**.
2. Sender email: the verified Gmail. Sender name: `Eain`.
3. Host: `smtp-relay.brevo.com`. Port: `587`. Username: the Brevo **Login** from 3.1. Password: the SMTP key.
4. **Save changes.**
5. **Authentication**, **Rate Limits**: emails per hour starts at 30. Raise it to 100 for the test.

### 3.3 The two email templates

**Authentication**, **Emails**, tab **Templates**.

1. Open **Confirm signup**. Replace the whole message body with:
   ```html
   <h2>Confirm your email</h2>
   <p>Tap the link below to confirm your Eain account.</p>
   <p>
     <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email"
       >Confirm my email</a
     >
   </p>
   ```
   Subject, for example: `Confirm your Eain account`. Save.
2. Open **Reset Password**. Replace the body with:
   ```html
   <h2>Reset your password</h2>
   <p>Tap the link below to choose a new password for your Eain account.</p>
   <p>
     <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery"
       >Choose a new password</a
     >
   </p>
   ```
   Save.

You can add a Burmese line under each; keep the link exactly as it is.

### 3.4 Site URL

1. **Authentication**, **URL Configuration**.
2. **Site URL:** your Vercel address from 2.3, for example `https://eain-project.vercel.app`. Email links are built from this.
3. **Redirect URLs:** add `https://eain-project.vercel.app/**` (your address plus `/**`). Save.

### 3.5 Try it

1. On your phone, open the site, **Sign up** with a real email you can read.
2. **You should see** a "check your email" message. The email arrives from "Eain" within a minute (check Spam the first time and mark it Not spam).
3. Tap the link. It opens the Eain site, signed in, and the dashboard shows **20 points**.

**If no email arrives:** in Brevo, **Transactional**, **Logs** shows whether Supabase sent it. If it is not there, recheck 3.2 (the username is the Brevo login, not your Gmail).

---

## Part 4. "Continue with Google"

### 4.1 Consent screen

1. Go to https://console.cloud.google.com. Top bar, project picker, **New project**, name `Eain`. Select it.
2. Menu, **APIs & Services**, **OAuth consent screen** (newer consoles call it **Google Auth Platform**, **Branding**).
3. User type **External**. App name `Eain`. Support email and developer contact: the Eain Gmail. Save through the steps; no scopes need adding.

### 4.2 The client

1. **APIs & Services**, **Credentials** (or **Google Auth Platform**, **Clients**), **Create credentials**, **OAuth client ID**, type **Web application**, name `Eain web`.
2. **Authorized JavaScript origins:** add `https://eain-project.vercel.app` (your address, no slash). Add `http://localhost:5173` too if you want Google sign-in while developing.
3. **Authorized redirect URIs:** add `https://<production project ref>.supabase.co/auth/v1/callback`. Supabase shows the exact value in the next step.
4. **Create.** Copy the **Client ID** and **Client secret** into your notes.

### 4.3 Supabase

1. Production project, **Authentication**, **Sign In / Providers**, **Google**. Turn it on.
2. Paste the **Client ID** and **Client secret**.
3. Paste the same Client ID into **Authorized Client IDs**. This is what lets Eain's server finish the sign-in without the browser touching Supabase.
4. Save.

### 4.4 Vercel

1. **Settings**, **Environment Variables**, add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = the Client ID.
2. **Deployments**, newest, **Redeploy**.
3. Open the login page on your phone. The Google button appears.

### 4.5 Publish

While the consent screen says **Testing**, only Google accounts you list under **Test users** can sign in. Before inviting testers: **OAuth consent screen** (or **Audience**), **Publish app**, confirm. With only basic sign-in scopes, Google does not ask for a review.

---

## Part 5. Your admin account

1. Sign up on the live site with the account you will run Eain from (part 3.5 may already have done this).
2. Supabase production, **Authentication**, **Users**. Find your email, click it, copy the **User UID**.
3. **SQL Editor**, **+ New query**:
   ```sql
   update public.profiles set role = 'admin' where id = 'PASTE-THE-UID-HERE';
   ```
   Run. You should see "Success. 1 row affected" (or "No rows returned"; then check the UID).
4. Sign out and in again, then open `https://<your address>/admin`. You see the platform overview.

---

## Part 6. Smoke test

Do section 4 of [LAUNCH.md](LAUNCH.md) on the live site, with two devices or one phone plus a private window. The short version:

1. Sign up, make a gift from **Birthday Postcard** with a photo and a question, publish.
2. Open the link in the private window, tap **Open your gift**, answer.
3. Back on the dashboard: Opened, the answer, two notifications, points up by 20.
4. Share the link to yourself on Messenger or Viber: the preview shows the generic text, never the message.
5. Open the **Wedding Invitation**: it shows 35,000 Ks and **How to buy**. The buy page says buying opens soon (the wallet numbers come in part 8).
6. In `/admin/users`, give your second account the Wedding Invitation with a test note. The second account can now use it.
7. Report a gift from its page; it appears in `/admin/reports`.

**The Myanmar test, the one that matters most.** Ask someone in Myanmar, on mobile data, with no VPN, to: open the site, sign up with email and confirm from the email, sign in with Google, reset the password, and open a gift with a photo. If any step hangs, ask for a screenshot of the error and the exact address in it.

Then, on your computer, run the two automated checks against production once. They make a throwaway user and gift in the database they are given, open the live pages as that user, and fail if any page would send a phone to `*.supabase.co`. So for this one run they need the **production** values, not the development ones:

1. In the project folder, create a file named `.env.local` with these four lines (values from your notes, part 1.2 and 2.3):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<production ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<production anon key>
   SUPABASE_SERVICE_ROLE_KEY=<production service_role key>
   NEXT_PUBLIC_SITE_URL=https://eain-project.vercel.app
   ```
   `.env.local` is never committed (it is in `.gitignore`), and it overrides `.env` while it exists.
2. Run:
   ```
   pnpm test:reachability
   pnpm test:email-links
   ```
   Both should end with `fail 0`. They delete their throwaway users (emails ending in `@example.com`) at the end.
3. **Delete `.env.local` straight away.** While it exists, `pnpm dev` and every other test would use the production database. If a run was interrupted, check **Authentication**, **Users** in production for `@example.com` users and delete them.

When all of this passes, invite the 20 to 30 closed-test people.

---

## Part 7. Your own domain (before the public launch)

1. **Buy it.** A `.com` costs about $10 to $15 a year (about 50,000 to 75,000 MMK) at Cloudflare Registrar, Porkbun or Namecheap. It needs a dollar card.
2. **Vercel**, **Settings**, **Domains**, **Add**, type the domain. Vercel shows the DNS records to create; add them at the registrar. Wait for the green check (minutes to a few hours).
3. Change the address everywhere the old one appears:
   - Vercel: `NEXT_PUBLIC_SITE_URL` = `https://yourdomain.com`, then Redeploy.
   - Supabase: **URL Configuration**, Site URL = `https://yourdomain.com`; add `https://yourdomain.com/**` to Redirect URLs.
   - Google: add `https://yourdomain.com` to **Authorized JavaScript origins**.
4. Optional, for email that lands in the inbox more often: in Brevo, **Senders, Domains**, add the domain and the DNS records it shows, then send from `hello@yourdomain.com` (change the sender in Supabase SMTP too).
5. Run the Myanmar test once more on the new address.

## Part 8. Before the first sale

1. **Vercel Pro** ($20 a month, about 98,000 MMK): **Settings**, **Billing**, upgrade. The free plan does not allow selling.
2. **Wallet numbers**, in Vercel Environment Variables, then Redeploy:

   | Name                     | Value                                                                                          |
   | ------------------------ | ---------------------------------------------------------------------------------------------- |
   | `EAIN_PAY_NAME`          | The name on the wallet accounts                                                                |
   | `EAIN_PAY_KBZPAY`        | KBZPay number, for example `09 123 456 789`                                                    |
   | `EAIN_PAY_WAVEPAY`       | WavePay number                                                                                 |
   | `EAIN_SALES_CONTACT_URL` | Your Facebook page's Messenger link, `https://m.me/<page>` (or a Viber or Telegram https link) |

3. Open `/dashboard/buy/wedding-invitation` on your phone: the three steps show your numbers and the **Message us** button opens your page.
4. Send yourself a small test payment and do the whole sale once: screenshot, find the account in `/admin/users`, give the template with a note.
5. Supabase Pro ($25 a month) can wait until the Usage page shows storage near 1 GB or egress near 5 GB a month.

---

## When something goes wrong

| What you see                                      | Usual cause                                      | Fix                                                    |
| ------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------ |
| Template picker or template page shows an error   | A migration is missing                           | Run the 1.3 check queries; paste the missing migration |
| Sign-up email never arrives                       | SMTP login wrong, or sender not verified         | Brevo Transactional Logs; recheck 3.1 and 3.2          |
| Email link opens a page that times out in Myanmar | The template still uses `{{ .ConfirmationURL }}` | Redo 3.3 exactly                                       |
| Email link says the link is invalid or expired    | Site URL wrong, or the link was used already     | Recheck 3.4; request a new email                       |
| No Google button                                  | Client ID missing, or provider off               | 4.3 and 4.4, then Redeploy                             |
| Google button says "origin not allowed"           | Site address not in JavaScript origins           | 4.2 step 2, exact address, no slash                    |
| `/admin` sends you to the dashboard               | Role not set, or old session                     | Part 5, then sign out and in                           |
| Vercel build fails                                | A variable missing or mistyped                   | Build log, first red line                              |
| Site sleeps or data errors after a quiet week     | Keep-alive job not running                       | 2.5                                                    |

For anything else, copy the exact error text or take a screenshot, and note which step you were on.
