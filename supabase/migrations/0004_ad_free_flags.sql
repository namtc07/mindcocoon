-- Remote switches for "watch one ad, no ads for a while" (see 0003 for app_config):
--   ad_free_enabled  boolean          offer it (in Settings and after hiding a native ad)
--   ad_free_hours    integer 1–72     how long banners and native ads stay away
-- Missing or malformed values fall back to on / 24 in the app.
insert into public.app_config (key, value) values
  ('ad_free_enabled', 'true'),
  ('ad_free_hours', '24')
on conflict (key) do nothing;
