# React Native + Supabase Demo

A React Native Expo app with Supabase and Vercel that demonstrates secure authentication, encrypted session persistence, and user-specific feature flags. The mobile client talks only to serverless API routes, while Supabase handles auth and row-level security for per-user access.

## What is included

- A mobile app in Expo / React Native for login, session handling, and UI rendering
- Supabase Auth and PostgreSQL with row-level security
- Vercel serverless endpoints for auth and config access
- Local development flow using Supabase CLI and Vercel dev

## Project structure

- `supabase/` — local database schema and migrations
- `api/` — serverless endpoints that proxy auth and config requests
- `mobile/` — Expo client app and environment-specific config

## Quick start

1. Install Docker, Node.js, and the Supabase CLI.
2. Copy the example environment file and fill in your local values.
3. Start Supabase and the Vercel API.
4. Run the mobile app with the appropriate staging or production script.

See the mobile README for the app-specific setup and demo credentials.

## Security notes

- Local environment files are kept out of version control.
- Supabase keys and secrets stay in local environment variables.
- The client app never stores Supabase credentials directly.
