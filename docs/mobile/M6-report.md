# M6 ads, rewarded sounds and native extras — report

Branch `feat/mobile-m6` (on `main`). Plan: `docs/superpowers/plans/2026-10-17-mobile-m6-ads-and-native-extras.md`.
Accounts/backup (M5) and Pro (RevenueCat) are deferred by the owner.

## What exists

- **Remote switches** (`app_config` in Supabase, migration `0003`): `ads_enabled`, `rewarded_enabled`,
  `quiet_hours`. Read without login using the publishable key, cached on the device, refreshed at
  start and when the app returns after 6 h. Offline/garbled → last cached → defaults (**ads off**).
- **AdMob**: starts only after the welcome is dismissed and a switch is on; UMP consent first (a form
  shows only where the law needs one), Teen content rating, **non-personalised requests only**, no
  ATT prompt. Development builds always use Google's test ads.
- **Banner**: adaptive, at the end of Today and Mood; hidden 23:00–05:00 (remote), when ads are off,
  or if nothing loads. Tests check it never appears on Vent, Vault, Sanctuary, Help, Settings or
  after-release.
- **Rewarded**: in Sanctuary → "More sounds", "Watch an ad to unlock Distant thunder for 24 hours"
  (Thunder, Forest stream, Singing bowl, Deep hum). Only on a tap; works in quiet hours; closing
  early or no ad → stays locked with "No ad right now. Try again later."
- **Evening reminder** (Settings): Off / 21:00 / 22:00 / 23:00, off by default, no badges, copy
  follows the language, cancelled by Erase everything.
- **Face ID / fingerprint** (Vault settings, passcode vaults only): turn on with the passcode once,
  then "Unlock with Face ID" on the lock screen. Changing/removing/resetting the passcode or erasing
  turns it off.

New native modules: `react-native-google-mobile-ads` 17.2.0, `expo-notifications`,
`expo-local-authentication` → rebuild:
`npx expo prebuild --clean -p ios && (cd ios && pod install) && npx expo run:ios`.

Env (`mobile/.env.local`, git-ignored, public values only): `EXPO_PUBLIC_SUPABASE_URL`,
`EXPO_PUBLIC_SUPABASE_KEY` (the publishable key — never the service-role key).

## Tests

Vitest: ads policy, remote config, unlocks. Jest: admob start-up, banner placement + forbidden
screens, rewarded unlock, reminder, biometric. Totals: mobile Vitest 70, Jest 115; web 166.

## Owner set-up (in order)

1. Supabase → SQL editor: run `supabase/migrations/0003_app_config.sql`; then `npm run test:live`
   (two new checks: anyone can read the switches, nobody can write them).
2. AdMob: create the iOS and Android apps and three ad units each (banner Today, banner Mood,
   rewarded). Put the **app IDs** in `mobile/app.json` → `react-native-google-mobile-ads` plugin
   (replacing Google's sample IDs) and the **unit IDs** in `extra.admob.ios|android`.
3. AdMob → Blocking controls: block dating, alcohol, gambling, weight loss; max content rating Teen.
4. AdMob → Privacy & messaging: create the GDPR (EEA/UK) message so UMP has a form to show.
5. Later, with the website: publish `app-ads.txt`.
6. When ready: in Supabase `app_config` set `rewarded_enabled` and/or `ads_enabled` to `true` — the app
   picks it up within 6 hours (or on the next cold start).

## Device checklist (after the rebuild)

1. With `ads_enabled = true` (or temporarily the cached flag), a **test** banner appears at the
   bottom of Today and Mood only — scroll every other screen to confirm none.
2. Set the clock to 23:30 → no banner; 05:00 → back.
3. Sanctuary → More sounds → watch the test rewarded ad to the end → Thunder plays, "Unlocked until …";
   close one early → stays locked.
4. Settings → Evening reminder 22:00 → allow notifications → set the device clock to 21:59 → it arrives
   at 22:00, no badge on the icon.
5. Simulator: Features → Face ID → Enrolled. Vault: set a passcode → turn on "Unlock with Face ID" →
   lock → unlock with Features → Face ID → Matching Face; Non-matching → passcode still works.
   Change the passcode → the Face ID button is gone.

## Known gaps

- Pro (no ads + all sounds) needs App Store Connect / Play Console products → later.
- A premium sound whose unlock expires keeps playing until paused.
