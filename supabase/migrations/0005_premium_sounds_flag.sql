-- premium_sounds_locked  boolean  the four extra sounds need a rewarded ad to open (false = all free).
-- All sounds are free for now; switch this on later if there is premium content worth unlocking.
insert into public.app_config (key, value) values
  ('premium_sounds_locked', 'false')
on conflict (key) do nothing;
