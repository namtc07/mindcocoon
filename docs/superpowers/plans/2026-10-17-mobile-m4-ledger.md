# SDD ledger — plan: docs/superpowers/plans/2026-10-17-mobile-m4-sanctuary.md

Pre-flight:
- T1→T2: engine API (createAudioEngine, AudioPrefs, reset, tick, setLabels) consumed by wiring — consistent.
- T1→T3/T5: minutesLeft, SLEEP_OPTIONS, play/toggle/pauseAll/resumeAll/stopAll — consistent.
- T3→T5: section-breathe/section-tonight testIDs + Screen scrollRef — consistent.
- T2→T4: expo-keep-awake installed + mocked in T2, used in T4 — consistent.
Task 1: Ruling: play() waits for the audio session before adding the track to the mix (plan said roll back on failure) — no player/lock-screen entry exists for a sound that never started; double taps during the wait are de-duplicated — cost if wrong: a ~1 frame delay before the button shows Pause
Task 1: complete (commits 77dac7a..d57845c, tests: bash -c 'cd mobile && npx vitest run test/audio-engine.test.ts' →    Duration  151ms (tests 83%, import 9%, transform 5%, worker 3%))
Task 2: Ruling: engine default clock reads Date.now at call time (was a captured reference) — lets the app-level sleep test (and any Date.now spy) move time — cost if wrong: none
Task 2: Ruling: startAudioLifecycle takes an injectable AppStateLike (default RN AppState), like createAutoLock — testable without the RN AppState mock — cost if wrong: none
Task 2: complete (commits d57845c..2a6e483, tests: bash -c 'cd mobile && npx jest __tests__/audio-wiring.test.tsx __tests__/settings.test.tsx' → Ran all test suites matching __tests__/audio-wiring.test.tsx|__tests__/settings.test.tsx.)
Task 3: Ruling: engine state gains `sleepMinutes` + `sleepMinutesLeft(state, now)` caps the shown minutes at the chosen option — useNow lags up to 5 s, so "20 min" showed as "21 min"; the chosen chip also survives remounts (web kept it in component state) — cost if wrong: one extra state field
Task 3: Ruling: Screen `scrollRef` moves to Task 5 where it is first used and tested — no untested prop added early — cost if wrong: none
Task 3: Ruling: shared PlayButton + toggleSound helper (not in the file map) used by TonightCard and SoundMixer — one place for the "Play: name" label and the play-error toast — cost if wrong: none
Task 3: complete (commits 2a6e483..702abd9, tests: bash -c 'cd mobile && npx jest __tests__/sanctuary.test.tsx && npx vitest run test/audio-engine.test.ts' →    Duration  148ms (tests 84%, import 9%, transform 4%, worker 3%))
Task 4: Ruling: jest.setup wraps Reanimated's mock useSharedValue in useState so it is stable across renders like the real hook — the mock's fresh object per render re-ran focus cleanups and stopped breathing instantly in tests — cost if wrong: tests diverge from the official mock
Task 4: Ruling: added phaseOf()/INNER_SIDE to breath-geometry (worklet-side phase lookup) beyond the plan's exports — cost if wrong: none
Task 4: Ruling: when Reduce Motion is on the inner square stays at rest (no scaling) as well as hiding the dot — spec asks for "bản giảm chuyển động"; the label + seconds still guide the breath — cost if wrong: less visual guidance for reduced-motion users
Task 4: complete (commits 702abd9..9b25d72, tests: bash -c 'cd mobile && npx vitest run test/breath-geometry.test.ts && npx jest __tests__/sanctuary.test.tsx' → 'This usually means that there are asynchronous operations that weren't stopped in your tests. Consider running Jest with `--detectOpenHandles` to troubleshoot this issue.)
Task 5: Ruling: Sanctuary sections are direct children of the scroll content (no wrapping gap View) so onLayout y is the scroll offset — cost if wrong: spacing set per section instead of one gap
Task 5: Ruling: MiniPlayer takes `safeBottom` (used on Vent where the tab bar is hidden) so it clears the home indicator; the sleep-timer readout is one accessible element "Sleep timer: N min" — cost if wrong: none
Task 5: complete (commits 9b25d72..82644cd, tests: bash -c 'cd mobile && npx jest __tests__/mini-player.test.tsx 2>&1 | grep -E 'Tests:'' → Tests:       7 passed, 7 total)
Task 6: complete (commits 82644cd..bec5fd3, tests: bash -c 'cd mobile && npm run typecheck >/dev/null && npx expo lint >/dev/null && npm test 2>&1 | grep -E 'Tests:|Tests  '' → Tests:       71 passed, 71 total)
Final review: opus reviewer — 1 Critical, 2 Important, 10 Minor.
Final: re-graded Minor 6 (VoiceOver gets no breathing phases: accessibilityLiveRegion is Android-only) → Important — a VoiceOver user gets a silent exercise.
Final: fixed C1 lock-screen/OS pause left players unsettled (real players don't report no-op pauses) → only one sound resumed and UI stuck on paused — "lock-screen pause then play brings the whole mix back" + "a sound the OS resumes after a call shows as playing again" RED→GREEN, suite 53+73
Final: fixed I2 saved volumes/master/loop not restored on cold start (engine created before prefs load) — restorePrefs + hydrateAudio; "applies prefs that were not readable…" + "saved volumes come back after a cold start" RED→GREEN, suite 53+73
Final: fixed I3 finished non-looping track could not play again (expo-audio stays at the end) — seekTo(0) on didJustFinish; "a finished track rewinds so it can play again" RED→GREEN, suite 53+73
Final: fixed I4 VoiceOver phase announcements — "VoiceOver hears each phase" RED→GREEN, suite 53+73
Final: minor (deferred): a brief buffering report (playing:false) could hold the whole mix — check on device; ignore buffering statuses if seen
Final: minor (deferred): Android may silently refuse audio focus (e.g. during a call) — UI shows playing with no sound
Final: minor (deferred): lock-screen Play after the sleep timer expired while suspended plays ~1 s before stopping
Final: minor (deferred): slider drags write prefs to SQLite on every step — persist on onSlidingComplete
Final: minor (deferred): breathing keeps its 250 ms label interval running after "done"
Final: minor (deferred): pulling down Control Center / notification shade (AppState inactive) ends the breathing exercise
Final: minor (deferred): MiniPlayer "Now playing" label ignored on iOS (View not accessible)
Final: minor (deferred): Jest worker leaks timers (sleep interval / useNow) — "worker failed to exit" warning
Final: minor (deferred): a play() pending during first audio-session setup survives reset()/stopAll()
Final: minor (deferred): fast Play→Stop during session setup ends up playing (double-tap de-dup)
