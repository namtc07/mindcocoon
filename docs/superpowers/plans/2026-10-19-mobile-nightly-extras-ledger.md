# SDD ledger — plan: docs/superpowers/plans/2026-10-19-mobile-nightly-extras.md

Pre-flight: T9 refactors release-sound into effects.ts (consumed by T1? no) — independent; T1 touches vent.tsx (also release-sound focus effect) — compatible. Tasks otherwise independent.
Ruling: widget (item 13) deferred — expo-widgets requires an App Group, which free Apple ID personal teams can't sign; home-widget deep links undocumented — cost if wrong: owner waits for the widget until a paid Apple Developer account.
Task 1: Ruling: setting a worry down needs an unlocked vault (it's encrypted with the data key); when locked the words stay in Vent with "Unlock your vault first…" instead of an inline passcode — cost if wrong: one extra step for passcode users
Task 1: Ruling: "morning" = next 06:00 local; waiting worries are not listed individually (no count), only "Some worries are resting until morning." — cost if wrong: none
Task 1: Ruling: the worry box screen shows UnlockPanel when the vault is locked and something is ready — cost if wrong: none
Task 1: complete (commits 1c88c2c..10f18cf, tests: bash -c 'cd mobile && npx jest __tests__/worries.test.tsx 2>&1 | grep Tests:' → Tests:       7 passed, 7 total)
Task 2: Ruling: only allow-listed notification URLs (/wind-down) are followed, de-duplicated per notification id+date; reminders scheduled before this change get the link on the next launch (ReminderSync reschedules) — cost if wrong: none
Task 2: complete (commits 10f18cf..c848d21, tests: bash -c 'cd mobile && npx jest __tests__/reminder.test.tsx 2>&1 | grep Tests:' → Tests:       9 passed, 9 total)
Task 3: complete (commits c848d21..31f762e, tests: bash -c 'npx vitest run packages/core/test/practices.test.ts | grep 'Tests '' →       Tests  3 passed (3))
Task 4: Ruling: six themes (Heavy days, Relationships, Study & work, Kindness to yourself, Hope, Knowing yourself), one per prompt; 'Surprise me' picks within the current filter — cost if wrong: some prompts could fit two themes
Task 4: complete (commits 31f762e..3394f4a, tests: bash -c 'cd mobile && npx jest __tests__/prompts.test.tsx 2>&1 | grep Tests:' → Tests:       6 passed, 6 total)
Task 4: note — the first full gate after Task 4 failed once on the pre-existing vault.test 'resets on this device only after an hour' (passed 3/3 alone and 2/2 full reruns): flaky under load, not caused by Task 4; the commit was made before reading that run (chained with ';' — fixed: commits now require the gate via &&).
Task 5: Ruling: thresholds — tag: ≥4 check-ins with one mood ≥60%; feeling word: picked on ≥3 check-ins in 7 days; late night: ≥4 anxious/heavy with ≥70% between 22:00–04:00; window 30 days; section titled 'Gently noticed' / 'Vài điều nhận ra', placed after the month map — cost if wrong: observations appear too rarely or too often
Task 5: complete (commits 3394f4a..d72947c, tests: bash -c 'npx vitest run packages/core/test/insights.test.ts >/dev/null && cd mobile && npx jest __tests__/insights.test.tsx 2>&1 | grep Tests:' → Tests:       2 passed, 2 total)
Task 6: Ruling: Year view is display-only (no tap to day detail), current year only, future days dimmed — cost if wrong: can't open a day from the year view
Task 6: complete (commits d72947c..c73c40b, tests: bash -c 'cd mobile && npx jest __tests__/year.test.tsx 2>&1 | grep Tests:' → Tests:       1 passed, 1 total)
Task 7: Ruling: the journey picture is this month only, opened from a button under the month/year view into a sheet with a preview; it includes the month+year title (a date, not a count) and up to five feeling words by frequency (frequency never shown) — cost if wrong: no past months
Task 7: complete (commits c73c40b..fb2207f, tests: bash -c 'cd mobile && npx jest __tests__/journey.test.tsx 2>&1 | grep Tests:' → Tests:       2 passed, 2 total)
Task 8: Ruling: night dim is on by default (22:00–06:00) and replaces whichever theme is chosen with a warm, low-contrast Midnight palette (mobile-only; web tokens untouched); status bar and keyboards follow a new `isDark` — cost if wrong: people who chose Mist get dark colours at night until they switch it off
Task 8: Ruling: PrefSwitch shared for the two on-by-default Settings toggles (release sound, night dim) — cost if wrong: none
Task 8: complete (commits fb2207f..b0d6386, tests: bash -c 'cd mobile && npx vitest run test/night-hours.test.ts >/dev/null && npx jest __tests__/night.test.tsx 2>&1 | grep Tests:' → Tests:       4 passed, 4 total)
Task 9: Ruling: effect sounds share one helper (effects.ts, one channel per use) with the release-sound session rules; breathing cues: rising tone on inhale, falling on exhale, a quieter tick on holds, light haptic on inhale/exhale only; on by default, toggle chip in the breathing card (also in wind-down) — cost if wrong: cues every 4 s may feel busy for some; one tap turns them off
Task 9: complete (commits b0d6386..57b292e, tests: bash -c 'cd mobile && npx jest __tests__/sanctuary.test.tsx __tests__/vent.test.tsx 2>&1 | grep Tests:' → Tests:       49 passed, 49 total)
Task 10: complete (commits 57b292e..3c46a6b, tests: bash -c 'npm test 2>&1 | grep 'Tests '' →       Tests  191 passed (191))
Final review: opus reviewer — 0 Critical, 5 Important, 9 Minor.
Final: re-graded Minor 1 (an unreadable worry can never be removed and keeps the Today line forever) → Important — a permanent nag.
Final: re-graded Minor 4+5 (readyLine says "last night" after Another day; vi "Là quy luật…", "Đã buông.") → Important — copy the person reads every morning; Vietnamese-first audience.
Final: fixed I1 failed worry save showed "unlock your vault" and left a phantom worry; double tap could store twice — storage-first save, VaultLockedError vs generic message, busy guard, catch in useWorries; "a failed save says so (not 'unlock'), keeps the words and stores nothing" RED→GREEN, suite 78+215
Final: fixed I2 insights could claim a pattern from one evening — thresholds count distinct days; "several check-ins on a single evening say nothing" RED→GREEN, suite 78+215
Final: fixed I3 cue toggle disabled while breathing — enabled; turning off stops the current cue; "cues can be turned off mid-session" RED→GREEN, suite 78+215
Final: fixed I4 breath cues dropped a paused mix's lock-screen session — effects leave the session alone when the mixer has playing or held sounds; "a paused Sanctuary mix keeps its lock-screen session" RED→GREEN (also replaced the eslint-disable with a lastCue ref, which dedupes cues), suite 78+215
Final: fixed I5 year squares wrapped on phones under ~398 pt — cell size from the row's measured width, nowrap; "year squares shrink to fit the row on a narrow phone" RED→GREEN, suite 78+215
Final: fixed I6 unreadable worry can be let go — "a worry that can't be read can still be let go" RED→GREEN; "Read" buttons now include the date for VoiceOver
Final: fixed I7 copy (readyLine "Something you set down is ready to look at." / "Điều bạn đã cất đang chờ bạn xem lại."; vi hint "Chỉ là vài điều lặp lại…"; vi letGoDone "Đã để nó đi.")
Final: added guard test "opening a ready worry while locked asks for the passcode" (passed before — guard only) and made the erase test assert the KV key is gone
Final: minor (deferred): journey picture failure shows the vault's "can't open" message instead of a picture-specific one
Final: minor (deferred): misplaced doc comment above yearGrid (belongs to shouldShowHeavyNudge)
Final: minor (deferred): a worry set down at 05:55 opens at 06:00 (consider a minimum rest)
Final: minor (deferred): vault test "resets on this device only after an hour" is flaky under load — give it a fake clock
