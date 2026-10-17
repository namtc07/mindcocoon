# SDD ledger — plan: docs/superpowers/plans/2026-10-17-mobile-m3-features.md
Spec: docs/superpowers/specs/2026-10-17-mindcocoon-mobile-design.md
Setup: branch feat/mobile-m3 off feat/mobile-m2 (owner said continue; M1/M2 not merged).
Setup: Ruling: native execution continues (owner's earlier choice); simulator checks handed to the owner unless a run is free — cost if wrong: UI issues surface in their run.
Pre-flight:
- T1→all: renderWithApp + UI kit used by every screen task — consistent.
- T2→T3/T4/T6: MoodPicker, GentleCard, HeavyNudge — consistent.
- T5 use-vault unavailable state → T3/T4/T6 inline passcode only when status locked — consistent.
Task 1: Ruling: two runners in mobile (Vitest for adapters, Jest/jest-expo for components; `npm test` runs both) — jest-expo is the supported RN component setup; rewriting the Vitest suites wasn't needed — cost if wrong: slightly slower test command.
Task 1: Ruling: Toast timing lives in the store (self-hiding) instead of component effects — testable with fake timers, no setState-in-effect — cost if wrong: none.
Task 1: Ruling: expo-haptics installed in Task 1 (the Jest setup mocks it) instead of Task 4 — cost if wrong: none.
Task 1: complete (commits 3ba0880..c51e2c7, tests: npm test --prefix mobile → Ran all test suites.)
Task 2: Ruling: lucide-react-native mocked in Jest (its .mjs build isn't transformed by jest-expo) — icons are decorative — cost if wrong: none.
Task 2: complete (commits c51e2c7..f1524f6, tests: npm test --prefix mobile → Ran all test suites.)
Task 2: Ruling: FOUND my process gap — Task 2 was committed while typecheck failed (/help didn't exist; the shell chain didn't gate on it). Added the /help stub + mobile/regen-route-types.sh; every commit from here is gated on 'typecheck && lint && test' exit codes — cost if wrong: none.
Task 3: Ruling: Today's screen title is the greeting (tab label stays 'Today', header shows the app name) — cost if wrong: copy only.
Task 3: complete (commits f1524f6..67d403f, tests: npm test --prefix mobile → Ran all test suites.)
Task 4: Ruling: vent hides header + tab bar statically via Tabs.Screen options (simpler than setOptions on focus); its own back link navigates to Today — cost if wrong: none.
Task 4: Ruling: dissolve animates up to 240 tokens (≈120 words + spaces) word-by-word as separate Animated.Text in a wrapping row (nested Text can't transform in RN); the rest fades together — cost if wrong: very long vents look simpler.
Task 4: Ruling: privacy cover when AppState is not active (covers iOS app-switcher snapshots) — cost if wrong: none.
Task 4: Ruling: Jest uses react-native-reanimated/jest/resolver (Reanimated 4 + worklets JS builds) — cost if wrong: none.
Task 4: complete (commits 67d403f..b6660f5, tests: npm test --prefix mobile → Ran all test suites.)
Task 5: Ruling: brief's startMobileAutoLock() is appAutoLock.start() (src/lib/app-auto-lock.ts); the pure createAutoLock lives in src/lib/auto-lock.ts so Vitest can load it without react-native — cost if wrong: a rename.
Task 5: Ruling: foreground activity = onTouchStart on the root View (observes, doesn't capture touches) — cost if wrong: typing-only sessions without touches could lock mid-write after the idle limit.
Task 5: Ruling: renderWithApp gained {storage, keepState}; tests that call core session functions directly wrap them in act() (unwrapped calls leaked state into the next test) — cost if wrong: none.
Task 5: Ruling: ToastHost was never mounted in the app (only in tests) — mounted in the root layout — cost if wrong: none.
Task 5: complete (commits b6660f5..c9c00eb, tests: npm test --prefix mobile → Ran all test suites.)
Task 6: Ruling: list semantics use role=list/listitem; tests find lists by accessibilityLabel (RNTL only matches accessible elements by role) — cost if wrong: none. Day detail is a Sheet — cost if wrong: layout only.
Task 6: complete (commits c9c00eb..4aa0680, tests: npm test --prefix mobile → Ran all test suites.)
Task 7: Ruling: erase re-initialises an empty vault (core wipeVault), so a NEW device key exists afterwards; the test asserts the old key is gone, not that the store is empty — cost if wrong: none.
Task 7: complete (commits 4aa0680..67cf761, tests: npm test --prefix mobile → Ran all test suites.)
Task 8: complete (commits 67cf761..59a821d, tests: npm test --prefix mobile → Ran all test suites.)
Final: fixed I1 stale AppState snapshot — app-state.test "reads the live app state…" RED→GREEN, suite 43/43 + 25/25
Final: fixed I2 typing not counted as activity — ui.test "counts typing as activity" RED→GREEN, suite 43/43
Final: Ruling: I2 second half (keep an in-progress vault edit through an auto-lock) not done — keeping a plaintext draft in memory while locked defeats the lock; with typing now counted as activity a lock mid-edit needs N idle minutes — cost if wrong: an edit left idle past the limit is lost.
Final: fixed I3 yesterday's check-in changed / details re-added — today.test "adds details to the same check-in", "never touches yesterday's…" + core updateMoodDetails tests RED→GREEN, suite green
Final: fixed I4 decrypted notes visible after lock; note kept in form — mood.test "hides decrypted notes…", today.test (empty note after save) RED→GREEN
Final: fixed I5 stacked modals on iOS — vault.test "12-word…" (card only after dismissal), vent.test "opens the save sheet only after the gentle card has gone" RED→GREEN (Jest Modal mock queues onDismiss like iOS)
Final: fixed I6 unavailable flag out of sync — vault.test "leaves the unavailable state when the vault opens from anywhere else" RED→GREEN
Final: fixed I7 save to vault fails silently — vent.test "says so when saving fails, and keeps the words" RED→GREEN
Final: fixed I8 erase not a true first run — settings.test (erase count bump → root remount; first-run notice reacts to prefs) RED→GREEN
Final: fixed I9 export copy left in cache — settings.test (file gone after share) RED→GREEN; erase also deletes leftover export files
Final: minor (deferred): Vietnamese erase word "xóa" without NFC / "xoá" spelling
Final: minor (deferred): several async onPress handlers (unlock, forgot, entry save/delete, vault settings actions, QuickCheckin pick) have no catch
Final: minor (deferred): "Remove passcode" has no confirmation
Final: minor (deferred): toasts hidden under open sheets on iOS
Final: minor (deferred): Screen lacks keyboardShouldPersistTaps / keyboard avoidance (Today, Mood)
Final: minor (deferred): heavy-nudge dismiss/link hit targets < 44pt
Final: minor (deferred): t.vault.unsupported says "This browser…" on mobile
Final: minor (deferred): HeavyNudge captures lastShownAt once per mount
Final: minor (deferred): Dissolve collapses repeated blank lines; very long words can overflow
Final: minor (deferred): only Vent is covered in the app switcher (unlocked vault/day detail visible in snapshot)
Final: minor (deferred): Jest worker didn't exit cleanly (open timer)
Final: Ruling: reviewer's "declined to judge" items (native undo after remount, iOS keyboard learning with autoCorrect off, snapshot timing of the privacy cover, touches inside sheets reaching the root) need a real device — added to the owner checklist — cost if wrong: privacy gaps on device.
