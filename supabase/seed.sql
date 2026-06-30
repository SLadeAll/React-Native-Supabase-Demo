-- Local-only demo data. Three users across the qualification tiers so RLS
-- behavior (which feature flags each can see) is easy to demonstrate.
-- All passwords: Password123!

do $$
declare
  free_id uuid := '00000000-0000-0000-0000-000000000001';
  beta_id uuid := '00000000-0000-0000-0000-000000000002';
  premium_id uuid := '00000000-0000-0000-0000-000000000003';
  demo_password text := crypt('Password123!', gen_salt('bf'));
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values
    ('00000000-0000-0000-0000-000000000000', free_id, 'authenticated', 'authenticated',
     'free@demo.dev', demo_password, now(), now(),
     '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', beta_id, 'authenticated', 'authenticated',
     'beta@demo.dev', demo_password, now(), now(),
     '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', premium_id, 'authenticated', 'authenticated',
     'premium@demo.dev', demo_password, now(), now(),
     '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
  on conflict (id) do nothing;

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values
    (gen_random_uuid(), free_id, free_id::text,
     format('{"sub":"%s","email":"%s"}', free_id, 'free@demo.dev')::jsonb, 'email', now(), now(), now()),
    (gen_random_uuid(), beta_id, beta_id::text,
     format('{"sub":"%s","email":"%s"}', beta_id, 'beta@demo.dev')::jsonb, 'email', now(), now(), now()),
    (gen_random_uuid(), premium_id, premium_id::text,
     format('{"sub":"%s","email":"%s"}', premium_id, 'premium@demo.dev')::jsonb, 'email', now(), now(), now())
  on conflict (provider, provider_id) do nothing;

  -- profiles rows already exist via the on_auth_user_created trigger.
  update public.profiles set is_beta_qualified = true
    where id = beta_id;
  update public.profiles set is_beta_qualified = true, is_premium_qualified = true
    where id = premium_id;
end $$;

insert into public.feature_flags (key, name, description, enabled, audience)
values
  ('new_dashboard', 'New Dashboard', 'Visible to every signed-in user.', true, 'all'),
  ('beta_chat', 'Beta Chat', 'Visible to beta-qualified users.', true, 'beta'),
  ('premium_reports', 'Premium Reports', 'Visible to premium-qualified users.', true, 'premium'),
  ('legacy_experiment', 'Legacy Experiment', 'Disabled kill-switch example.', false, 'all')
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  enabled = excluded.enabled,
  audience = excluded.audience,
  updated_at = now();
