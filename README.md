# React Native · Supabase · Vercel — Feature Flag Demo

A full-stack mobile app demonstrating role-based feature flags, secure auth, and a serverless API proxy.

**Production API:** https://react-native-supabase-project.vercel.app  
**Vercel project:** https://vercel.com/oscarjavvera-1294s-projects/react-native-supabase-project  
**GitHub:** https://github.com/SLadeAll/React-Native-Supabase-Demo

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native · Expo SDK 56 · TypeScript |
| Styling | NativeWind v4 (Tailwind CSS) |
| Auth & DB | Supabase (GoTrue + PostgreSQL + RLS) |
| API | Vercel Serverless Functions (TypeScript) |
| Sessions | expo-secure-store + AsyncStorage (AES-encrypted) |

---

## Project Structure

```
.
├── api/                       # Vercel serverless functions
│   ├── auth/
│   │   ├── login.ts
│   │   ├── register.ts
│   │   ├── refresh.ts
│   │   ├── logout.ts
│   │   └── change-password.ts
│   └── config.ts              # Returns feature flags for the signed-in user
├── mobile/                    # Expo app
│   ├── screens/
│   │   ├── LoginScreen.tsx    # Login + sign-up with password strength indicator
│   │   ├── IntroScreen.tsx    # Project tutorial & live feature flags
│   │   ├── AboutScreen.tsx    # Developer profile
│   │   └── SettingsScreen.tsx # Change password + sign out
│   ├── components/
│   │   ├── TabBar.tsx
│   │   └── PasswordStrength.tsx
│   ├── lib/
│   │   ├── session.ts         # Auth state, token refresh, sign-in/sign-up/sign-out
│   │   ├── secureStore.ts     # AES-encrypted session persistence with fallback
│   │   ├── config.ts          # Reads EXPO_PUBLIC_API_BASE_URL
│   │   └── network.ts         # fetch wrapper with Metro console logging
│   └── .env.example           # Copy to .env.staging or .env.production
└── supabase/
    ├── config.toml
    ├── migrations/
    └── seed.sql               # Demo users (local only)
```

---

## Demo Accounts

| Email | Password | Feature flag access |
|---|---|---|
| `free@demo.dev` | `Password123!` | Public flags |
| `beta@demo.dev` | `Password123!` | Public + beta flags |
| `premium@demo.dev` | `Password123!` | All flags |

---

## Quick Start — Production (no local server needed)

The API is already live. Just run the mobile app pointed at Vercel:

```bash
cd mobile
npm install
```

Create `mobile/.env.production`:

```env
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_API_BASE_URL=https://react-native-supabase-project.vercel.app
```

```bash
npm run start:production
```

Scan the QR code with Expo Go or press `a` for the Android emulator.

---

## Local Development

### Prerequisites

- Node.js 18+
- Docker Desktop
- Expo Go on your device / Android emulator

### 1 — Install dependencies

```bash
npm install
cd mobile && npm install
```

### 2 — Start local Supabase

```bash
supabase start        # requires Docker Desktop running
supabase db reset     # applies migrations + seeds demo users
```

### 3 — Start the Vercel dev server

```bash
vercel dev --listen 3000
```

### 4 — Configure the mobile env

```bash
cp mobile/.env.example mobile/.env.staging
```

Edit `mobile/.env.staging`:

```env
EXPO_PUBLIC_APP_ENV=staging
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

> **Android emulator:** run `adb reverse tcp:3000 tcp:3000` once, then `localhost:3000` works.  
> **Physical device:** replace `localhost` with your machine's LAN IP (e.g. `192.168.1.x`).

### 5 — Start Expo

```bash
cd mobile
npm run start:staging
```

---

## Deploying

### Push schema to Supabase cloud

```bash
supabase db push --linked --yes
```

### Deploy API to Vercel

```bash
vercel deploy --prod
```

### Vercel environment variables

| Variable | Value |
|---|---|
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_ANON_KEY` | Anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `APP_ENV` | `staging` (Preview) / `production` (Production) |

> Use `printf` (not `echo`) when piping values to `vercel env add` to avoid adding a UTF-8 BOM.

---

## Security Notes

- `.env.staging` and `.env.production` are excluded from version control via `.gitignore`.
- The mobile app never holds Supabase credentials — all requests go through the Vercel API layer.
- Sessions are AES-256 encrypted before being stored on-device.
