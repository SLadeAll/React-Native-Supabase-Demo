-- Seed demo data for feature flags and profiles
-- Note: `public.profiles.user_id` references `auth.users(id)`; replace the placeholder
-- USER_ID below with a valid auth user id before running, or set to NULL to skip profile insertion.

begin;

-- Insert a demo feature flag
insert into public.feature_flags (id, key, description, enabled, rollout_percentage)
values (
  gen_random_uuid(),
  'demo_new_ui',
  'Enable the new UI for demo users',
  true,
  100
)
on conflict (key) do update set
  description = excluded.description,
  enabled = excluded.enabled,
  rollout_percentage = excluded.rollout_percentage,
  updated_at = now();

-- Insert a demo feature flag event with no user (system event)
insert into public.feature_flag_events (id, user_id, flag_key, event_type, metadata)
values (
  gen_random_uuid(),
  null,
  'demo_new_ui',
  'created',
  jsonb_build_object('source', 'seed')
)
on conflict do nothing;

-- Optional: insert a demo profile (requires a valid auth.users id)
-- replace '<USER_ID>' with a real uuid or set to NULL to skip.
-- insert into public.profiles (id, user_id, full_name, email, avatar_url)
-- values (gen_random_uuid(), '<USER_ID>'::uuid, 'Demo User', 'demo@example.com', null)
-- on conflict (user_id) do update set full_name = excluded.full_name, email = excluded.email, updated_at = now();

commit;
