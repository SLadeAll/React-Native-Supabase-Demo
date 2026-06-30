# React Native + Supabase project

This workspace now includes a local Supabase project scaffold with starter tables for:
- user profiles
- feature flags
- feature flag events

## Local setup
1. Install Docker Desktop and start it.
2. Run `supabase start`.
3. Run `supabase db push`.
4. Copy `.env.example` to `.env.local` and fill in the generated local values.

## Remote Supabase setup
1. Run `supabase login`.
2. Create or link a Supabase project:
   - `supabase projects create <project-name>`
   - or `supabase link --project-ref <project-ref>`
3. Push migrations with `supabase db push`.

## Vercel connection
1. Run `vercel login`.
2. Run `vercel link` inside this folder.
3. Add the Supabase env vars to Vercel.

## Migrations and seeding

Run migrations locally with the Supabase CLI (recommended):

```bash
# start local Supabase (Docker required)
supabase start

# push migrations
supabase db push

# apply seed migration (if using supabase CLI, migrations include seed files)
supabase db reset --skip-db
supabase db push
```

If you don't have the Supabase CLI, you can run the SQL files directly against a Postgres instance.

Example using Docker Postgres and `psql`:

```bash
# run Postgres container
docker run --name supabase-dev -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15

# apply migration file (replace connection params as needed)
psql "postgresql://postgres:postgres@localhost:5432/postgres" -f supabase/migrations/20260629120000_init_user_tracking_and_feature_flags.sql
psql "postgresql://postgres:postgres@localhost:5432/postgres" -f supabase/migrations/20260629121000_seed_demo_data.sql
```

Notes:
- The `profiles` table references `auth.users(id)` from Supabase Auth; inserting demo profiles may fail unless the `auth` schema/user rows exist. Replace placeholder `<USER_ID>` in seed files with a valid auth user id or skip profile insertion.
- If you want me to run migrations locally, ensure `supabase`, `psql`, or Docker are installed and let me proceed.