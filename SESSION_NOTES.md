# Session notes

Summary of what was built and decided while implementing the take-home
assessment (local-only Supabase + Vercel + Expo stack with qualification-gated
feature flags). For setup/run instructions see `README.md` and
`mobile/README.md` — this file is the "why," not the "how."

## Architecture decisions

- **Qualification model**: `public.profiles` has `is_beta_qualified` /
  `is_premium_qualified` booleans; `public.feature_flags` has an `audience`
  column (`all` / `beta` / `premium`). A single RLS `select` policy on
  `feature_flags` joins the two, so "premium/beta flags only visible to
  qualified users" is enforced by Postgres itself, not application code.
  Demo users: `free@demo.dev` (neither), `beta@demo.dev` (beta only),
  `premium@demo.dev` (both — premium implies beta).
- **Unauthenticated requests are rejected outright**, not just filtered to
  zero rows: the RLS policy requires `auth.uid() is not null`, and table
  grants aren't given to `anon` at all (local Supabase no longer
  auto-exposes new tables — this needed explicit `GRANT`s, see below).
- **No Supabase access from the mobile client at all.** Originally the app
  used `@supabase/supabase-js` directly for auth. Mid-session this was
  reworked so the app only ever talks to the Vercel API: `api/auth/login.ts`,
  `refresh.ts`, and `logout.ts` forward to Supabase Auth server-side, and
  `api/config.ts` forwards the caller's access token to PostgREST. The
  Supabase URL and anon key now live only in the API's environment —
  removed entirely from the mobile app's env files and bundle. Session
  storage/refresh logic was hand-rolled in `mobile/lib/session.ts` to
  replace what `supabase-js` used to provide.
- **Staging/production toggle** is `.env.staging` / `.env.production` +
  `dotenv-cli` npm scripts + matching `eas.json` build profiles. Both
  envs point at the same local stack (everything must run locally per the
  assessment's constraints) but `EXPO_PUBLIC_APP_ENV` differs and is visible
  as a badge in the app and echoed by the API.
- **E2E**: Maestro, chosen over Detox for Expo-managed-workflow simplicity
  (no native ejecting required).

## Real bugs found by actually running things (not just reading code)

1. Local Supabase's new default doesn't auto-grant table privileges to
   `anon`/`authenticated` — RLS policies alone weren't enough, PostgREST
   returned `42501` for everyone. Fixed with explicit `GRANT`s in the
   migration. Caught via direct `curl` against PostgREST with real tokens.
2. Android emulator can't reach the host via `127.0.0.1` (resolves to the
   emulator itself) — needed `10.0.2.2`. Caught via a `ConnectException` in
   the on-device LogBox during manual emulator testing.
3. `vercel dev` refuses to start if `package.json` has a `"dev": "vercel dev"`
   script (recursive-invocation guard) — removed that script.
4. React Native DevTools / "Open JS Debugger" doesn't work with Expo Go on
   RN 0.85's Hermes Bridgeless engine (no CDP support yet). Worked around
   with a small `lib/network.ts` `loggedFetch` wrapper that logs to the
   Metro console instead, plus `docker logs -f supabase_kong_...` for
   backend-side request visibility.

## What was actually verified live (this session had Docker + a real
Android emulator available, not just a code-writing sandbox)

- `supabase db reset` applies the migration + seed cleanly.
- `curl` against PostgREST with each demo user's real token returns exactly
  the expected flag sets (free: 1, beta: 2, premium: 3); anon gets rejected.
- `vercel dev` + `/api/config` reproduces the same RLS-filtered results.
- The new `/api/auth/login|refresh|logout` proxy endpoints verified via curl.
- Full login → home (correct flags per user) → sign-out cycle clicked
  through for real on a `Pixel_4_API_30` emulator, both before and after the
  auth-proxy rework.
- Session persistence: force-killed the app process while logged in and
  relaunched — landed on the home screen with no re-login prompt, confirming
  the encrypted `LargeSecureStore` session survives a real restart.

## Known gaps / what's still unverified

- The Maestro YAML flow (`mobile/.maestro/login_and_feature_flags.yaml`) was
  authored to match the manually-verified flow above, but the Maestro binary
  itself was never installed/run in this environment — it needs to be run
  for real on a machine with Maestro + a simulator/emulator as the final
  verification step.
- Both staging and production env configs point at the same local stack
  (by necessity, per the assessment's "must run completely locally"
  constraint) — the *mechanism* for environment switching is real and
  tested, but there's no second live backend to prove true isolation
  end-to-end.
