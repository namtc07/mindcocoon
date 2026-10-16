-- MindCocoon v1 schema.
-- Everything private reaches this database only as client-side ciphertext.
--   vault_backups           one encrypted snapshot per user (journal + moods), plus the
--                           passcode/recovery-code wraps of the data key (useless without them)
--   vault_recovery_secrets  random server half used ONLY to reset a forgotten passcode on a
--                           device that already holds the data; never wraps anything uploaded
--   app_opens               anonymous open counts: random device id, hour, locale

-- ---------------------------------------------------------------------------
-- vault_backups
-- ---------------------------------------------------------------------------
create table public.vault_backups (
  user_id uuid primary key references auth.users (id) on delete cascade,
  ciphertext text not null,
  wraps jsonb not null,
  snapshot_version integer not null default 1,
  updated_at timestamptz not null default now(),
  constraint vault_backups_ciphertext_is_envelope check (ciphertext like 'v1.%'),
  constraint vault_backups_wraps_have_recovery check (wraps ? 'recovery')
);

alter table public.vault_backups enable row level security;

create policy "vault_backups: owner reads"
  on public.vault_backups for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "vault_backups: owner inserts"
  on public.vault_backups for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "vault_backups: owner updates"
  on public.vault_backups for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "vault_backups: owner deletes"
  on public.vault_backups for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.vault_backups to authenticated;

-- ---------------------------------------------------------------------------
-- vault_recovery_secrets (created once, read by its owner; never updated by clients)
-- ---------------------------------------------------------------------------
create table public.vault_recovery_secrets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  secret text not null default encode(extensions.gen_random_bytes(32), 'base64'),
  created_at timestamptz not null default now()
);

alter table public.vault_recovery_secrets enable row level security;

create policy "vault_recovery_secrets: owner reads"
  on public.vault_recovery_secrets for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "vault_recovery_secrets: owner creates"
  on public.vault_recovery_secrets for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Clients may only send user_id; the secret is always generated here.
grant select on public.vault_recovery_secrets to authenticated;
grant insert (user_id) on public.vault_recovery_secrets to authenticated;

-- ---------------------------------------------------------------------------
-- app_opens (insert-only, anonymous)
-- ---------------------------------------------------------------------------
create table public.app_opens (
  id bigint generated always as identity primary key,
  device_id uuid not null,
  hour_bucket timestamptz not null,
  locale text not null,
  constraint app_opens_locale check (locale in ('vi', 'en')),
  constraint app_opens_hour_aligned check (hour_bucket = date_trunc('hour', hour_bucket at time zone 'UTC') at time zone 'UTC')
);

create unique index app_opens_device_hour on public.app_opens (device_id, hour_bucket);

alter table public.app_opens enable row level security;

create policy "app_opens: anyone records an open near now"
  on public.app_opens for insert to anon, authenticated
  with check (hour_bucket between now() - interval '2 hours' and now() + interval '1 hour');

-- No select/update/delete for clients: counts are read with the dashboard or service role.
grant insert (device_id, hour_bucket, locale) on public.app_opens to anon, authenticated;
