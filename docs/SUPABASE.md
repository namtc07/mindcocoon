# Supabase setup

MindCocoon uses Supabase only from the browser (`lib/supabase/client.ts`) for:

- **Auth** — optional sign-in (email one-time code, Google) for people 16 and over.
- **`vault_backups`** — one end-to-end-encrypted snapshot per user. The server cannot read it.
- **`vault_recovery_secrets`** — a random server half used to reset a forgotten passcode on a
  device that already has the data. It never wraps anything that is uploaded.
- **`app_opens`** — anonymous open counts (random device id, hour, locale).

Without `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` the app runs fully
local and hides everything account-related.

## 1. Project and keys

Project ref: `apqhxpcgtpzayswgdcqw`. Put the keys in `.env.local` (git-ignored) and in the
Vercel project's environment variables:

| Variable | Where it is used |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser (`sb_publishable_…`) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only, `app/api/account/route.ts` |

## 2. Apply the schema

Open **SQL Editor** in the dashboard, paste `supabase/migrations/0001_init.sql`, run it.
(With the Supabase CLI: `supabase link --project-ref apqhxpcgtpzayswgdcqw && supabase db push`.)

Then run the advisors (Dashboard → Advisors → Security) and fix anything they flag.

## 3. Auth providers (Dashboard → Authentication)

1. **Email**: enabled, with "Email OTP" (6-digit code). Keep "Confirm email" on.
2. **Google**: enable, add the OAuth client id/secret from Google Cloud Console.
3. **URL configuration** → Redirect URLs:
   - `http://localhost:3000/*/auth/callback`
   - `https://<your-domain>/*/auth/callback`
4. **SMTP** (before launch): configure a real SMTP sender — the built-in mailer is rate-limited.

## 4. Before launch

- Rotate the service-role key: create a new secret key (`sb_secret_…`), update Vercel, then
  disable the legacy JWT keys. (The current one was shared in a chat session.)
- Re-run the security advisors.
