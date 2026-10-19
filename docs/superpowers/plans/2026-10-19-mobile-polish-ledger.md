# SDD ledger — plan: docs/superpowers/plans/2026-10-19-mobile-polish.md

Pre-flight: tasks independent; T3 touches engine.applyMix return type (consumers: MixChips, wind-down, suggest-actions) — all updated in T3.
Task 1: Ruling: evening mode 18:00–04:59 — check-in+suggestion, entries (Wind down first), prompt last; the worry-ready line shows only in day mode (it's a morning thing); daytime entries: Let it out, Breathe, Practices, Tonight's music, Wind down — cost if wrong: someone checking a worry at night won't see the line until 05:00 (the worry box is still reachable from Vent's flow... and /worries)
Task 1: complete (commits d63e564..c87f88d, tests: bash -c 'cd mobile && npx jest __tests__/today-order.test.tsx 2>&1 | grep Tests:' → Tests:       3 passed, 3 total)
Task 2: Ruling: Mood order = check-in, gently noticed, week, month/year (+ picture), history; history shows 5 then 'Show earlier check-ins' (up to 30) — cost if wrong: one more tap to see older check-ins
Task 2: complete (commits c87f88d..98076de, tests: bash -c 'cd mobile && npx jest __tests__/mood-layout.test.tsx 2>&1 | grep Tests:' → Tests:       2 passed, 2 total)
Task 3: Ruling: applyMix with no playable sound now leaves the current mix playing and returns 0 (was: stop everything) — cost if wrong: none
Task 3: Ruling: Toast gained an optional action (shown 5 s); Undo restores the removed mix in number order — cost if wrong: none
Task 3: Ruling: in wind-down, when something already plays, "Keep what's playing" is preselected and Goodnight only sets the timer — cost if wrong: none
Task 3: complete (commits 98076de..898e698, tests: bash -c 'cd mobile && npx jest __tests__/sound-polish.test.tsx 2>&1 | grep Tests:' → Tests:       5 passed, 5 total)
Task 4: Ruling: one app-wide PrivacyCover in the root layout (Vent's and practices' own covers stay; harmless duplicates); sheets/modals opened at the moment of switching may still appear above it on iOS — cost if wrong: a modal's content could show in the snapshot
Task 4: Ruling: keyboard handling via ScrollView automaticallyAdjustKeyboardInsets (iOS) + keyboardShouldPersistTaps; Android relies on the default adjustResize — check on device
Task 4: complete (commits 898e698..547ebca, tests: bash -c 'cd mobile && npx jest __tests__/touch-privacy.test.tsx 2>&1 | grep Tests:' → Tests:       6 passed, 6 total)
Task 5: Ruling: the erase word accepts NFC/NFD, any case, surrounding spaces and the older accent placement (xoá = xóa); mobile uses its own 'unsupported' text (web keeps the browser wording) — cost if wrong: none
Task 5: complete (commits 547ebca..0195778, tests: bash -c 'cd mobile && npx jest __tests__/small-fixes.test.tsx 2>&1 | grep Tests:' → Tests:       7 passed, 7 total)
Task 5: correction — the Task 5 commit (0195778) was made while the mobile gate was red (wind-down tests pressed the removed Skip; the biometric test didn't confirm the new passcode-removal alert) because the gate result wasn't chained into the commit. Fixed in the next commit with the full gate green. Commits now sit inside an if-block on both gates.
Task 6: complete (commits dea8f68..0a6389f, tests: bash -c 'cd mobile && npm test 2>&1 | grep 'Tests:'' → Tests:       238 passed, 238 total)
Final review: opus reviewer — 0 Critical, 4 Important, 9 Minor.
Final: re-graded Minor 11 (Vietnamese copy: Bỏ/Gỡ mismatch, "Giữ âm đang phát", "Xem các lần trước") → Important — Vietnamese-first audience. Fixed.
Final: fixed I1 worry box unreachable in the evening (Task 1 ruling's mitigation was wrong — no other path) — the line shows in both modes; "a ready worry is reachable in the evening too" RED→GREEN
Final: fixed I2 Vent's stale-prompt clean-up targeted the next focused screen — uses Vent's own navigation.setParams; small-fixes test asserts navigation.setParams (not router.setParams) RED→GREEN; verify on device
Final: fixed I3 open sheets (day detail notes, recovery code…) weren't covered in the app switcher — PrivacyCover inside Sheet's Modal; "an open sheet is covered in the app switcher too" RED→GREEN
Final: fixed I4 Today remounted its blocks at 18:00/05:00 (typed note lost) — one keyed list; "a note being typed survives the switch at 18:00" (mocked clock; verified it fails without the fix) RED→GREEN, suite 80+241
Final: process note — the first version of the 18:00 test hung Jest (fake timers + userEvent); replaced with a mocked useNow in its own file.
Final: Ruling: the root-level "react-native-google-mobile-ads" key in app.json (Google's test App IDs) was written by the AdMob library's native script during the owner's rebuild and swept into the Task 1 commit; kept (the library reads it) and added to the release checklist next to the plugin's IDs — cost if wrong: release build keeps test IDs if only one place is changed
Final: minor (deferred): undo edge cases — same toast text keeps the old action; undo after saving a new mix can duplicate "My mix 1" or exceed five; a quick second removal replaces the first undo
Final: minor (deferred): screen-reader volume changes (VoiceOver/TalkBack actions) never fire onSlidingComplete, so they aren't saved
Final: minor (deferred): wind-down "keep" choice can go stale if playback stops before Goodnight
Final: minor (deferred): the privacy cover flashes behind Face ID / permission prompts (iOS reports inactive)
Final: minor (deferred): Android keyboard (edge-to-edge) and recents snapshot are unverified — check on device
Final: minor (deferred): toast with Undo: 5 s may be short for VoiceOver; long text can overflow narrow screens
Final: minor (deferred): commit 0195778 stays red in history (fixed by dea8f68); squash before merge if bisect matters
