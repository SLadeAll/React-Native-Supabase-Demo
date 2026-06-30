# Mobile (Expo / React Native)

Minimal Expo app: email/password login, then a home screen that renders
exactly the feature flags the backend's row-level security returns for the
signed-in user. The app talks to exactly one backend surface — the Vercel
API — for both auth and data; it never holds a Supabase URL or anon key.

## Architecture: no Supabase access from the client

- `lib/session.ts` implements sign-in/refresh/sign-out by calling
  `/api/auth/login`, `/api/auth/refresh`, and `/api/auth/logout`, which
  forward to Supabase Auth server-side (see `../api/auth/`). Sessions
  (access token, refresh token, expiry, user) are persisted via the same
  encrypted `LargeSecureStore` as before, and a timer refreshes the access
  token ~1 minute before it expires.
- `screens/HomeScreen.tsx` calls `/api/config` with the stored access token,
  same as before.
- There is no `@supabase/supabase-js` dependency in this app at all — the
  only thing it knows about is `EXPO_PUBLIC_API_BASE_URL`.

## Environment toggle (staging vs production)

Which backend the app talks to is controlled by which `.env.*` file is
loaded before Metro starts — see `.env.staging` / `.env.production` and the
`start:staging` / `start:production` npm scripts (uses `dotenv-cli`). The
same vars are wired into `eas.json` build profiles so a real EAS build
toggles the same way. Both files point at the single local Vercel dev
server here (since everything must run locally with no cloud provisioning),
but `EXPO_PUBLIC_APP_ENV` differs and is visible as the colored badge in the
top-right corner of the app and echoed back by the API response — in a real
deployment you'd point each file's `EXPO_PUBLIC_API_BASE_URL` at its own
staging/production Vercel deployment instead.

The host URLs in those files (`10.0.2.2`) target the **Android emulator** —
`127.0.0.1` inside the emulator refers to the emulator itself, not your
host machine, so requests to the local Vercel dev server would otherwise
fail with `ConnectException`. If you're running on a physical device, swap
`10.0.2.2` for your machine's LAN IP; on iOS simulator or web, `127.0.0.1`
works as-is.

## Run locally

```bash
npm install

# in one terminal: local Supabase (see ../README.md)
# in another terminal: the Vercel API (see ../README.md)

npm run start:staging      # or start:production
```

Demo users (seeded by `supabase/seed.sql`), all with password `Password123!`:

| email              | sees flags                                  |
|--------------------|----------------------------------------------|
| free@demo.dev      | `new_dashboard`                               |
| beta@demo.dev      | `new_dashboard`, `beta_chat`                  |
| premium@demo.dev   | `new_dashboard`, `beta_chat`, `premium_reports` |

`legacy_experiment` is disabled and never shows for anyone — it demonstrates
the `enabled` kill switch independent of audience targeting.

## E2E test (Maestro)

`.maestro/login_and_feature_flags.yaml` logs in as `beta@demo.dev` and
asserts the beta-tier flags are visible while the premium-only flag is not —
proving the UI reflects backend-driven, per-user configuration rather than a
hardcoded list.

1. Install the Maestro CLI (requires Java 11+): https://maestro.mobile.dev/getting-started/installing-maestro
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```
2. Have an Android emulator or iOS simulator running, with this app
   installed/running on it (`npm run android:staging` or `npm run ios:staging`,
   or a `dev-client`/standalone build from `eas build --profile staging`).
3. Run the flow:
   ```bash
   maestro test .maestro/login_and_feature_flags.yaml
   ```

The login → home-screen → sign-out flow it automates was manually verified
against a real Android emulator, including after switching the app to the
Vercel auth-proxy architecture above (login as `beta@demo.dev`, `beta_chat`
and `new_dashboard` visible, `premium_reports` absent, sign out returns to
the login screen). Session persistence was also verified separately: logging
in as `premium@demo.dev`, force-stopping the app (`adb shell am force-stop`,
equivalent to fully closing it), and relaunching landed straight on the home
screen with the same flags — no re-login prompt, confirming the encrypted
`LargeSecureStore` session survives a real app restart. Maestro itself
wasn't available in the environment this was built in, so the flow file is
untested by the actual Maestro binary — run it on your machine as the final
verification step.
