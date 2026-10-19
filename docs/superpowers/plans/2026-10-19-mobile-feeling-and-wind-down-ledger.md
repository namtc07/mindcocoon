# SDD ledger — plan: docs/superpowers/plans/2026-10-19-mobile-feeling-and-wind-down.md

Pre-flight:
- T1→T2/T3/T4: FEELINGS, suggestionFor, store feelings param — consistent.
- T3→T4: suggestion actions reused by wind-down (applyMix playable, breathing prefs) — consistent.
- T5 independent (Dissolve + Settings).
Task 1: Ruling: feelingsFor() filters words to the mood and caps at 3 in the store (addMood/changeMood/updateMoodDetails), so bad input can't be stored — cost if wrong: none
Task 1: complete (commits d7332a9..83572ea, tests: bash -c 'npx vitest run packages/core/test/mood.test.ts packages/core/test/feelings.test.ts | grep 'Tests '' →       Tests  20 passed (20))
Task 2: Ruling: feeling chips show right under the quick check-in (no need to open details) and save on each tap, like the one-tap mood — cost if wrong: Today gets a row taller after checking in
Task 2: complete (commits 83572ea..b7cc26a, tests: bash -c 'cd mobile && npx jest __tests__/today.test.tsx __tests__/mood.test.tsx 2>&1 | grep Tests:' → Tests:       17 passed, 17 total)
Task 3: Ruling: the card follows today's latest check-in (also from the Mood tab), sits right under the quick check-in, and 'Not now' hides it for the rest of the day — cost if wrong: none
Task 3: complete (commits b7cc26a..3da1c60, tests: bash -c 'cd mobile && npx jest __tests__/suggestions.test.tsx 2>&1 | grep Tests:' → Tests:       6 passed, 6 total)
Task 4: Ruling: wind-down is the first entry on Today ("Wind down for sleep") and is not added to Sanctuary (plan said both) — Today is where the night starts; Sanctuary already holds the same parts — cost if wrong: one more tap from Sanctuary
Task 4: Ruling: BoxBreathing gained a `fixed` prop (hides the chooser) so wind-down breathes the suggested rhythm for 1 minute without changing the person's saved choice — cost if wrong: none
Task 4: Ruling: picking a mood in wind-down saves/changes today's check-in immediately (like Today), "Next" needs a mood, "Skip" doesn't — cost if wrong: none
Task 4: complete (commits 3da1c60..33d3e8a, tests: bash -c 'cd mobile && npx jest __tests__/wind-down.test.tsx __tests__/ads.test.tsx 2>&1 | grep Tests:' → Tests:       19 passed, 19 total)
Task 5: Ruling: the release sound is stopped when Vent loses focus, not when the dissolve unmounts — so it isn't cut short by Reduce Motion's 600 ms fade — cost if wrong: the sound may run ~1 s past the animation
Task 5: Ruling: sounds are synthesized placeholders (scripts/generate-sfx.mjs: crackle, water, wind, soft chime), volume 0.5, peaks around −7 dB — cost if wrong: may sound synthetic; swap for licensed recordings later
Task 5: Ruling: the Settings toggle sits under the evening reminder as its own row (no new section) — cost if wrong: none
Task 5: complete (commits 33d3e8a..0d09892, tests: bash -c 'cd mobile && npx jest __tests__/vent.test.tsx __tests__/settings.test.tsx 2>&1 | grep Tests:' → Tests:       22 passed, 22 total)
Task 6: complete (commits 0d09892..4f4d87b, tests: bash -c 'npm test 2>&1 | grep 'Tests '' →       Tests  182 passed (182))
Final review: opus reviewer — 0 Critical, 4 Important, 15 Minor.
Final: re-graded Minor 13 (unnatural Vietnamese: "Ghé lại cảm xúc", "Âm thanh khi buông", "đặt điện thoại xuống rồi", "uể oải" for flat) → Important — owner's focus is experience, audience Vietnamese-first. Fixed (copy; parity tests).
Final: re-graded Minor 4 (fast feeling-word taps lose a word) → Important — same root as I1, fixed together (serialized writes).
Final: fixed I1 Today's quick check-in kept a stale copy (words saved to a removed log, duplicate check-ins) — follows the store's latest check-in for today, writes serialized; "follows a check-in changed elsewhere (e.g. wind-down) and saves words on it" RED→GREEN, suite 77+187
Final: Ruling: as a consequence, tapping a mood on Today changes today's existing check-in (even from an earlier session or the Mood tab) instead of adding a second one — one quick check-in per day, as "Saved for today" says — cost if wrong: people who want several check-ins a day must use the Mood tab's full form
Final: fixed I2 quick double tap in wind-down could duplicate check-ins — serialized writes on the live log; guard test "two quick mood taps make one check-in with the last mood" (passed before the fix in Jest: the in-memory store doesn't reproduce the device's write latency — guard only)
Final: fixed I3 release sound used the app's audio session (stopped other apps' music / ignored the silent switch) — mixWithOthers + respects silent when no Sanctuary sound plays, engine.invalidateSession() so the mixer re-applies doNotMix; stale-sound generation guard; "with nothing playing, the sound mixes with other apps and respects the silent switch" RED→GREEN, "while the mixer plays, the sound joins its session unchanged", suite 77+187
Final: fixed I4 "Sleep well" screen had no player controls (plan deviation) — MiniPlayer rendered on the night step, Goodnight disabled while starting; "the night screen shows what's playing and can stop it" RED→GREEN, suite 77+187
Final: minor (deferred): Goodnight silently replaces a mix that was already playing (no "keep what's playing" option)
Final: minor (deferred): applyMix never rejects (allSettled) so failed playback isn't reported (Goodnight / Listen)
Final: minor (deferred): Breathe suggestion awaits setPref before navigating (a failed write makes the tap do nothing)
Final: minor (deferred): the 4th feeling-word tap is silently ignored (chips not marked disabled at 3)
Final: minor (deferred): suggestion label column fixed at 44pt may wrap "Breathe" with large text
Final: minor (deferred): with `fixed`, the breathing intro still says "Pick a rhythm…"; breathe step's Skip and Next do the same
Final: minor (deferred): presets bypass the premium check with () => true (all presets are free today)
Final: minor (deferred): burn's 3rd haptic (620 ms) overlaps the 600 ms Reduce Motion end
Final: minor (deferred): switching the release-sound setting off doesn't stop a sound already playing
Final: minor (deferred): wind-down tile sits above "Let it out" all day (could lead only in the evening)
