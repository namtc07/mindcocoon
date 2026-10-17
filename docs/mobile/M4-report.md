# M4 native Sanctuary — report

Branch `feat/mobile-m4` (on `main`). Plan: `docs/superpowers/plans/2026-10-17-mobile-m4-sanctuary.md`.

## What exists

- **Box breathing**: 4 s in / hold / out / hold, 4 rounds (~64 s). The square and dot are drawn on the
  UI thread (Reanimated + SVG); the phase label and seconds come from core `breathAt`. The screen
  stays on while breathing (`expo-keep-awake`). Leaving the tab or the app stops and resets it.
  Reduce Motion: no moving dot, the inner square stays still, labels still change.
- **Tonight's music**: picked from today's latest check-in (else a soft piece), plays with ambient sounds.
- **Sounds**: Rain, Ocean, Night wind, Campfire mixed together; per-sound volume, overall volume and
  loop (all remembered). Premium sounds come back in M6 with rewarded ads.
- **Sleep timer**: Off / 10 / 20 / 30 / 60 min; fades over the last minute, then stops everything.
  Re-checked whenever the app returns to the foreground.
- **Background + lock screen** (`expo-audio`): keeps playing with the screen locked; the lock screen /
  notification shows "Rain + Ocean · MindCocoon" (album "Sanctuary", in the app's language).
  Pause/play there, a phone call, Siri or unplugging headphones pause or resume the whole mix.
- **Mini player** above the tab bar on every tab (also on Vent, where the tab bar is hidden): mix
  name (opens Sanctuary), minutes left on the sleep timer, pause/resume, stop.
- **Today links**: "Breathe for a minute" and "Tonight's music" scroll Sanctuary to that section.
- **Erase everything** also stops sound, clears the lock screen and resets volumes.

New native modules: `expo-audio` (config plugin: background playback on, **no microphone
permission**), `expo-keep-awake`, `@react-native-community/slider` → **rebuild the dev client**
(`npx expo run:ios`, `npx expo run:android`).

Audio files in `mobile/assets/audio` are the web's generated placeholders (~5 MB) — replace them
with licensed recordings before launch (already on the launch checklist).

## Tests

- Vitest: mixer engine (`test/audio-engine.test.ts`, 21 — sleep fade/late tick, lock-screen leader,
  status sync for lock-screen and OS pauses), breathing geometry (`test/breath-geometry.test.ts`, 3).
- Jest: `audio-wiring` (sources, background session, foreground re-check, labels per language),
  `sanctuary` (mixer, tonight, sleep timer, breathing incl. keep-awake/tab blur/background),
  `mini-player` (bar, sleep minutes, deep links + scroll), `settings` (erase stops sound).
- Totals: mobile Vitest 49, Jest 71; web 166.

## Owner checklist (device / simulator after the rebuild)

1. Play Rain + Ocean, lock the phone → keeps playing ≥ 10 min (on Android too: no cut-off at ~3 min).
2. Lock screen / notification shows "Rain + Ocean · MindCocoon"; Pause there pauses both and the
   in-app bar shows Resume; Play resumes both.
3. A phone call / Siri / unplugging headphones pauses everything; Resume restores the whole mix.
4. Sleep timer 10 min with the phone locked: fades in the last minute and stops; lock screen cleared.
5. Start Spotify, open MindCocoon without playing → Spotify keeps playing. Play Rain → Spotify pauses
   (expected: lock-screen controls need exclusive audio).
6. iPhone silent switch on → sounds still play.
7. Breathing (64 s): the screen does not dim; smooth on a mid-range Android; with Reduce Motion on,
   no moving dot.
8. Mini player shows on every tab including Vent and never covers the Vent buttons or the home indicator.
9. Today → "Breathe for a minute" / "Tonight's music" land on the right section.
10. Erase everything while playing → sound stops, lock screen cleared.
11. Settings → Tiếng Việt → the next sound shows a Vietnamese title on the lock screen.

## Known gaps

- Playback is not restored after the app is killed (volumes, master and loop are).
- Settings and Help (stack screens) don't show the mini player.
- Evening reminder and Face ID unlock (spec §4 "Native thêm") are not scheduled yet.
