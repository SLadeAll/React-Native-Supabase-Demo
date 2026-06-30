# React Native + Supabase project

A fully local-first stack demonstrating qualification-based feature flags:

- **`supabase/`** — local Postgres schema (`profiles`, `feature_flags`) with
  row-level security so that beta/premium feature flags are only readable by
  users qualified for them. Enforced at the database layer, not the app.
- **`api/`** — Vercel serverless functions that are the *only* surface the
  mobile app talks to. `api/auth/login.ts`, `refresh.ts`, and `logout.ts`
  forward to Supabase Auth server-side; `api/config.ts` forwards the
  caller's own access token to PostgREST, so RLS still applies. Supabase's
  URL and anon key live only in this layer's environment — the mobile app
  never holds them.
- **`mobile/`** — a minimal Expo (React Native) app: email/password login,
  securely persisted session, and a home screen that renders whatever flags
  `/api/config` returns for the signed-in user. Switches between
  staging/production config via env files. See `mobile/README.md`.

Everything runs locally via the Supabase CLI + `vercel dev` — no cloud
resources are provisioned.

## 1. Local Supabase

```bash
supabase start          # requires Docker Desktop running
supabase db reset       # applies migrations + supabase/seed.sql
supabase status         # prints local URLs + anon/service_role keys
```

This creates three demo users (password `Password123!` for all):

| email             | is_beta_qualified | is_premium_qualified |
|-------------------|--------------------|------------------------|
| free@demo.dev     | false              | false                  |
| beta@demo.dev     | true               | false                  |
| premium@demo.dev  | true               | true                   |

And four feature flags (`audience` = `all` / `beta` / `premium`, plus one
disabled flag to demonstrate the `enabled` kill switch):
`new_dashboard` (all), `beta_chat` (beta), `premium_reports` (premium),
`legacy_experiment` (all, disabled).

The `feature_flags_select_for_qualified_users` RLS policy on
`public.feature_flags` (see `supabase/migrations/`) is what actually
enforces this — an anonymous request gets zero rows, and an authenticated
user only sees flags whose audience they qualify for.

## 2. Vercel API

```bash
cp .env.example .env
# fill in SUPABASE_ANON_KEY from `supabase status`
npm install
npx vercel dev            # defaults to http://localhost:3000
```

- `POST /api/auth/login` — `{ email, password }` → `{ accessToken, refreshToken, expiresAt, user }`
- `POST /api/auth/refresh` — `{ refreshToken }` → same shape, with fresh tokens
- `POST /api/auth/logout` — `Authorization: Bearer <accessToken>` → revokes the refresh token server-side
- `GET /api/config` — `Authorization: Bearer <accessToken>` → `{ environment, profile, featureFlags }`, filtered by RLS for that user

All four forward to Supabase (Auth or PostgREST) using only the anon key,
scoped to the caller's own token — never the service role key. The mobile
app only ever calls this API; it has no Supabase URL or anon key at all.

To exercise the flow manually:

```bash
curl -s -X POST "http://localhost:3000/api/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"beta@demo.dev","password":"Password123!"}'
# -> { accessToken, refreshToken, expiresAt, user }

curl -s "http://localhost:3000/api/config" -H "Authorization: Bearer <accessToken>"
```

## 3. Mobile app

See `mobile/README.md` — covers the staging/production env toggle, running
the app, demo credentials, and the Maestro E2E flow.

## Remote Supabase / Vercel (optional, not required by this assessment)

1. `supabase login`, then `supabase link --project-ref <project-ref>`.
2. `supabase db push` to apply migrations to a real project.
3. Add `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` to
   Vercel (`vercel env add ...`) and `vercel deploy --prod`.
