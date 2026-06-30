create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  description text,
  enabled boolean not null default false,
  rollout_percentage integer not null default 0 check (rollout_percentage between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feature_flag_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  flag_key text not null references public.feature_flags(key) on delete cascade,
  event_type text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.handle_updated_at();

create trigger feature_flags_set_updated_at
before update on public.feature_flags
for each row execute procedure public.handle_updated_at();

alter table public.profiles enable row level security;
alter table public.feature_flags enable row level security;
alter table public.feature_flag_events enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "Anyone can read enabled feature flags"
  on public.feature_flags for select
  using (enabled = true);

create policy "Service role can manage feature flags"
  on public.feature_flags for all
  using (auth.role() = 'service_role');

create policy "Users can insert their own feature flag events"
  on public.feature_flag_events for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can view their own feature flag events"
  on public.feature_flag_events for select
  using (auth.uid() = user_id);
