# SDD ledger — plan: docs/superpowers/plans/2026-10-18-mobile-more-choices.md

Pre-flight: tasks share prefs, dictionaries and vent.tsx (T3, T5) — T5 adds a param beside T3's picker; no interface conflicts.
Note: owner skipped Q&A and asked for autonomous build overnight; all product choices are Claude's (ledgered).
Task 1: Ruling: new title "Breathe"/"Thở" and intro under new keys (breathingTitle/breathingIntro); the web's breatheTitle/breatheIntro keys are left untouched — web unchanged — cost if wrong: none
Task 1: Ruling: non-box patterns use the same square shape growing/shrinking (no travelling dot); the dot only fits a four-sided rhythm — cost if wrong: less visual variety
Task 1: Ruling: BreathState.secondsLeft widened from 1|2|3|4 to number (needed for 7 s / 8 s phases); web still typechecks — cost if wrong: none
Task 1: Ruling: Chip gained an optional `disabled` prop (choices locked while breathing) — cost if wrong: none
Task 1: complete (commits cd1ec19..627f3ab, tests: bash -c 'npx vitest run packages/core/test/breathing.test.ts >/dev/null && cd mobile && npx jest __tests__/sanctuary.test.tsx 2>&1 | grep Tests:' → Tests:       20 passed, 20 total)
Task 2: Ruling: SavedMix stores a number `n` instead of a name, rendered as "My mix n"/"Bộ của tôi n" — names follow the app language; no rename UI (keeps it simple) — cost if wrong: people can't name their mixes
Task 2: Ruling: 4th preset is "Rain at sea" (rain .5, ocean .4, night-wind .2) instead of the plan's "deep-forest-rain" name — the mix has no forest sound — cost if wrong: none
Task 2: Ruling: applying a mix clears `held` (a paused mix is replaced by the new one) — cost if wrong: none
Task 2: complete (commits 627f3ab..0515ccb, tests: bash -c 'npx vitest run packages/core/test/mixes.test.ts >/dev/null && cd mobile && npx vitest run test/audio-engine.test.ts >/dev/null && npx jest __tests__/sanctuary.test.tsx 2>&1 | grep Tests:' → Tests:       26 passed, 26 total)
Task 3: Ruling: planDissolve tests live in Jest (vent.test.tsx), not Vitest — Dissolve.tsx imports react-native — cost if wrong: none
Task 3: Ruling: the ritual picker sits in the Vent footer above the buttons (horizontal chips), visible only while writing — cost if wrong: footer is a little taller on small phones
Task 3: Ruling: tint per ritual (burn → ember, float → primary sage, scatter → muted, fade → no tint) — cost if wrong: none
Task 3: complete (commits 0515ccb..75aec5c, tests: bash -c 'cd mobile && npx jest __tests__/vent.test.tsx 2>&1 | grep Tests:' → Tests:       14 passed, 14 total)
Task 4: Ruling: backgrounding a practice covers the screen (like Vent) instead of clearing what was typed; leaving the screen (blur) clears it — a quick app switch shouldn't destroy a half-written letter — cost if wrong: typed text survives in memory while the app is in the background
Task 4: Ruling: timed steps show a quiet "20s" countdown and never auto-advance; keep-awake only while a timed step is on screen — cost if wrong: none
Task 4: Ruling: "Keep in my vault" reuses SaveSheet (gained optional defaultTitle = practice title); body = each question followed by its answer — cost if wrong: none
Task 4: Ruling: extracted <StackHeader/> (Settings, practices) and added Redirect to the expo-router Jest mock; unknown practice ids redirect to the list — cost if wrong: none
Task 4: Ruling: practices appear in three places — a Today entry, a Sanctuary section, and /practices — cost if wrong: Sanctuary page gets longer
Task 4: complete (commits 75aec5c..6cb07f8, tests: bash -c 'npx vitest run packages/core/test/practices.test.ts >/dev/null && cd mobile && npx jest __tests__/practices.test.tsx __tests__/ads.test.tsx 2>&1 | grep Tests:' → Tests:       19 passed, 19 total)
Task 5: Ruling: "Surprise me" opens Vent straight away with a random prompt (plan: highlight + scroll) — one tap to writing, less fiddly — cost if wrong: people can't preview the surprise before writing
Task 5: Ruling: "More prompts" is a quiet underlined link next to "Another prompt" on Today — cost if wrong: none
Task 5: complete (commits 6cb07f8..e93a7c4, tests: bash -c 'cd mobile && npx jest __tests__/prompts.test.tsx __tests__/ads.test.tsx 2>&1 | grep Tests:' → Tests:       19 passed, 19 total)
Task 6: complete (commits e93a7c4..20d0f4d, tests: bash -c 'npm test 2>&1 | grep 'Tests '' →       Tests  176 passed (176))
Final review: opus reviewer — 0 Critical, 4 Important, 9 Minor (+2 recommendations).
Final: re-graded Minor 4+5 (stiff Vietnamese copy; stale "Four slow boxes of breath" tile) → Important — the owner's complaint is about experience and the audience is Vietnamese-first.
Final: re-graded Minor 7 (ad-free test for a practice rendered nothing) → Important — a vacuous guard on an absolute rule.
Final: fixed I1 breathing came back to life after "Well done" when changing rhythm/length — "changing the length after finishing starts fresh instead of resuming" RED→GREEN, suite 77+162
Final: fixed I2 practice timer kept the screen on all night — "a timed step lets the screen sleep once its time is up" RED→GREEN, suite 77+162
Final: fixed I3 practices bypassed the safety flow — gentle card on heavy words + help link on writing steps and the finish view; "heavy words in a practice get the same gentle card and help link as Vent" RED→GREEN, suite 77+162
Final: fixed I4 VoiceOver heard nothing on a new practice step — "VoiceOver hears each new step" RED→GREEN, suite 77+162
Final: fixed I5 Vietnamese copy (Chọn cách buông, Hít vào/thở ra, Bản phối, Xóa, Về với hiện tại 5-4-3-2-1) + mobile-only tile text "Box, 4-7-8 or a slow exhale" (web keeps its own) + removed unused practices.open — copy change, covered by i18n parity tests, suite 77+162
Final: fixed I6 ad-free test for a practice now renders a real practice — the test asserts the practice is on screen and no banner, suite 77+162
Final: minor (deferred): a mix whose sounds fail to load, or whose only sounds are expired premium ones, stops everything with no message (Promise.allSettled swallows errors)
Final: minor (deferred): two fast preset taps on the very first play can leave both mixes playing (no generation token in applyMix)
Final: minor (deferred): one tap on × deletes a saved mix with no undo
Final: minor (deferred): SaveSheet's default title is applied silently (could be the title field's placeholder)
Final: minor (deferred): the practice privacy cover has no test
Final: minor (deferred): unused innerScale alias / breathAtWorklet / phaseOf exports
Final: minor (deferred): device check — Vent tab may keep a stale promptIndex param after visiting the library, then "Write about this" on Today could show the library prompt
Final: minor (deferred): optional soft haptic when a timed practice step ends
