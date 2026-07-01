# Mobile app

This is the Expo / React Native client for the demo. It handles login, secure session persistence, and UI rendering based on feature flags returned by the backend.

## Architecture

- The app calls the Vercel API for sign-in, token refresh, sign-out, and config loading.
- It does not ship with Supabase credentials or client-side Supabase SDK access.
- Session data is stored securely and refreshed automatically when needed.

## Environment setup

The app uses environment files to switch between staging and production targets. The local scripts load those files before Metro starts, so the same codebase can point at different backend URLs.

## Local run

```bash
npm install

# Start local Supabase and the Vercel API first
npm run start:staging
```

## Demo accounts

The seeded demo users all use the password `Password123!`:

| email | behavior |
| --- | --- |
| free@demo.dev | sees the base dashboard flag |
| beta@demo.dev | sees beta flags |
| premium@demo.dev | sees premium flags |

## E2E testing

A Maestro flow is included for a basic login and feature-flag check. Run it after starting the app in an emulator or simulator.
