-- Remote switches for the mobile app, read anonymously (no login) with the publishable key:
--   ads_enabled       boolean            banners on Today/Mood (still hidden in quiet hours)
--   rewarded_enabled  boolean            "watch an ad to unlock a sound for 24 hours"
--   quiet_hours       [start, end] | null local hours with no banner (may wrap past midnight)
-- Values are edited in the dashboard (or with the service role); clients can only read.

create table public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;

create policy "app_config: anyone reads"
  on public.app_config for select to anon, authenticated
  using (true);

-- Supabase grants ALL on new public tables by default (see 0002): keep clients read-only.
revoke all on public.app_config from anon, authenticated;
grant select on public.app_config to anon, authenticated;

-- Ads start switched off; flip these in the dashboard when the AdMob account is ready.
insert into public.app_config (key, value) values
  ('ads_enabled', 'false'),
  ('rewarded_enabled', 'false'),
  ('quiet_hours', '[23, 5]');
