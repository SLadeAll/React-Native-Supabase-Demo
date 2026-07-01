create extension if not exists pgcrypto;

-- One row per auth user. id = auth.users.id keeps the 1:1 relationship simple.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  is_beta_qualified boolean not null default false,
  is_premium_qualified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- audience encodes which qualification a user needs to see this flag.
create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  description text,
  enabled boolean not null default true,
  audience text not null default 'all' check (audience in ('all', 'beta', 'premium')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add columns if the tables were created by older migrations without them.
do $$ begin
  alter table public.profiles add column is_beta_qualified boolean not null default false;
exception when duplicate_column then null; end $$;
do $$ begin
  alter table public.profiles add column is_premium_qualified boolean not null default false;
exception when duplicate_column then null; end $$;
-- Older migrations may have added a redundant user_id column; make it nullable so
-- our trigger (which only inserts id + email) doesn't violate the constraint.
do $$ begin
  alter table public.profiles alter column user_id drop not null;
exception when undefined_column then null; end $$;
do $$ begin
  alter table public.feature_flags add column name text not null default '';
exception when duplicate_column then null; end $$;
do $$ begin
  alter table public.feature_flags add column description text;
exception when duplicate_column then null; end $$;
do $$ begin
  alter table public.feature_flags
    add column audience text not null default 'all'
    check (audience in ('all', 'beta', 'premium'));
exception when duplicate_column then null; end $$;

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.handle_updated_at();

drop trigger if exists feature_flags_set_updated_at on public.feature_flags;
create trigger feature_flags_set_updated_at
before update on public.feature_flags
for each row execute procedure public.handle_updated_at();

-- Auto-create a profile row whenever a new auth user signs up (or is seeded).
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.feature_flags enable row level security;

do $$ begin
  create policy "profiles_select_own"
    on public.profiles for select
    using (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "profiles_update_own"
    on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- No insert/delete policy for authenticated/anon: profiles are only ever
-- created by the handle_new_user trigger (runs as table owner, bypasses RLS).

-- Anyone unauthenticated gets zero rows. Authenticated users only see flags
-- that are enabled and whose audience they qualify for.
do $$ begin
create policy "feature_flags_select_for_qualified_users"
  on public.feature_flags for select
  using (
    auth.uid() is not null
    and enabled = true
    and (
      audience = 'all'
      or (
        audience = 'beta'
        and exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.is_beta_qualified
        )
      )
      or (
        audience = 'premium'
        and exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.is_premium_qualified
        )
      )
    )
  );
exception when duplicate_object then null; end $$;

-- No insert/update/delete policy for authenticated/anon: only service_role
-- (which bypasses RLS) manages feature flags.

-- Table-level grants. Local Supabase no longer auto-exposes new public
-- tables to the API roles, so without these, PostgREST rejects every
-- request with 42501 before RLS even runs. anon gets nothing on either
-- table — unauthenticated requests must be rejected outright.
grant usage on schema public to authenticated, service_role;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;

grant select on public.feature_flags to authenticated;
grant select, insert, update, delete on public.feature_flags to service_role;
