# SDD ledger — plan: docs/superpowers/plans/2026-10-17-mobile-m6-ads-and-native-extras.md

Pre-flight:
- T1→T2: RemoteFlags/parseFlags/DEFAULT_FLAGS consumed by remote-config — consistent.
- T1,T2,T3→T4: canShowBanner(flags, ready), useFlags, useAdsReady, adUnitId, AD_REQUEST — consistent.
- T3→T5: adUnitId("rewarded"), AD_REQUEST, canOfferRewarded — consistent.
- T6/T7 share prefs + eraseEverything only — no conflict.
Task 1: complete (commits 45c43a3..a957ed8, tests: bash -c 'cd mobile && npx vitest run test/ads-policy.test.ts | grep 'Tests '' →       Tests  8 passed (8))
Task 2: Ruling: split into remote-config-core.ts (pure, Vitest) + remote-config.ts (app instance, prefs, AppState) — Vitest can't load react-native — cost if wrong: none
Task 2: Ruling: migration hand-written as 0003 (no Supabase CLI in this repo; 0001/0002 were owner-applied the same way) + live tests for anon read / no client writes, to run with `npm run test:live` after the owner applies it — cost if wrong: owner must apply before flags work (app stays on defaults = ads off)
Task 2: Ruling: `a` (deleted by the earlier live test) is reused for the update check — if it's already deleted, the update simply returns no rows; still asserts no write — cost if wrong: weaker authenticated-write check
Task 2: complete (commits a957ed8..da5d4d0, tests: bash -c 'cd mobile && npx vitest run test/remote-config.test.ts | grep 'Tests '' →       Tests  6 passed (6))
Task 2: Ruling: mobile/.env.example not committed — the repo ignores .env* (root .env.example is untracked too); variable names go in the M6 report — cost if wrong: none
Task 3: Ruling: `userTrackingUsageDescription` omitted from the AdMob plugin (plan said `false`; the option is a string and omission is what keeps NSUserTrackingUsageDescription out) — verified with expo config introspect — cost if wrong: none
Task 3: Ruling: start-up gating lives in an <AdsBootstrap/> component in the root layout (flags via useFlags, firstRunSeen via prefs) — reactive to both without polling — cost if wrong: none
Task 3: Ruling: a failed initialize() clears the start promise so the next trigger retries — cost if wrong: repeated init attempts on a broken SDK
Task 3: complete (commits da5d4d0..79a8eab, tests: bash -c 'cd mobile && npx jest __tests__/admob.test.tsx 2>&1 | grep Tests:' → Tests:       6 passed, 6 total)
Task 4: Ruling: an empty release unit id (owner hasn't filled app.json extra.admob yet) renders no banner — cost if wrong: none
Task 4: complete (commits 79a8eab..d663124, tests: bash -c 'cd mobile && npx jest __tests__/ads.test.tsx 2>&1 | grep Tests:' → Tests:       11 passed, 11 total)
Task 5: Ruling: pure unlock maths in unlocks-core.ts (Vitest) + prefs wrapper unlocks.ts — prefs can't load under Vitest — cost if wrong: none
Task 5: Ruling: the unlock is saved on EARNED_REWARD (not on close), and an ERROR after earning still counts as unlocked — the person watched the ad — cost if wrong: none
Task 5: Ruling: locked premium rows are hidden entirely when rewarded ads are off; already-unlocked ones stay playable — no dead "watch an ad" buttons — cost if wrong: premium sounds invisible until the flag is on
Task 5: Ruling: watching again renews the unlock to 24 h from now — cost if wrong: none
Task 5: complete (commits d663124..5cbed4a, tests: bash -c 'cd mobile && npx vitest run test/unlocks.test.ts >/dev/null && npx jest __tests__/rewarded.test.tsx 2>&1 | grep Tests:' → Tests:       8 passed, 8 total)
Task 6: Ruling: reminder tests are Jest only (no test/reminder.test.ts) — the module needs prefs + expo-notifications, which Vitest can't load; all plan cases are covered in __tests__/reminder.test.tsx — cost if wrong: none
Task 6: Ruling: iOS permission asks alert + sound, never badges (no red dots, spec anti-goal); Android uses an "evening" channel named after the setting — cost if wrong: none
Task 6: Ruling: added settings.reminderOff ("Off"/"Tắt") instead of reusing the sleep timer's string — cost if wrong: one extra key
Task 6: complete (commits 5cbed4a..bd8d709, tests: bash -c 'cd mobile && npx jest __tests__/reminder.test.tsx 2>&1 | grep Tests:' → Tests:       7 passed, 7 total)
Task 7: Ruling: Face ID unlock is a button on the lock screen (no automatic prompt on open) — the person chooses, and a cancelled prompt never blocks the passcode field — cost if wrong: one extra tap
Task 7: Ruling: any error while reading the gated item counts as "cancelled" (item kept); only a stored passcode that no longer opens the vault is "failed" (item deleted) — error texts differ by platform; Android key invalidation after a biometric change shows up as repeated cancels until the person turns it off/on — cost if wrong: an invalidated Android item lingers until re-enabled
Task 7: Ruling: added vault.biometricEnable ("Turn on"/"Bật") for the confirm button and a useBiometricMethod hook (not in the plan) — cost if wrong: none
Task 7: complete (commits bd8d709..bfcfd7f, tests: bash -c 'cd mobile && npx jest __tests__/biometric.test.tsx 2>&1 | grep Tests:' → Tests:       9 passed, 9 total)
Task 8: complete (commits bfcfd7f..d31a8e1, tests: bash -c 'cd mobile && npm run typecheck >/dev/null && npx expo lint >/dev/null && npm test 2>&1 | grep -E 'Tests:'' → Tests:       115 passed, 115 total)
Final review: opus reviewer — 1 Critical, 4 Important, 11 Minor.
Final: re-graded Minor 3 (Android channel shows an icon badge/dot) → Important — spec anti-goal "chấm đỏ thông báo".
Final: re-graded Minor 4a (report says switching ads off applies on the next cold start; really up to 6 h+) → Important — the owner would rely on it to pull ads quickly; fixed the code (cold start forces a fetch) so the doc is true.
Final: fixed C1 rewarded ad could open full-screen over Vent/Vault/Help/breathing after the person left Sanctuary — "leaving Sanctuary before the ad loads never shows it" + "the app going to the background before the ad loads never shows it" RED→GREEN, suite 70+127
Final: fixed I1 UMP consent form could appear over a forbidden screen — AdsBootstrap starts only on Today/Mood; "never starts (or asks for consent) on Vent, Vault, Sanctuary or Help" RED→GREEN, suite 70+127
Final: fixed I2 consent result ignored + no way to change consent — ready only when canRequestAds (fallback to last consent info), Settings "Ad privacy choices" when required; "no ads when consent says ads can't be requested", "a consent failure falls back to the last known consent", "Settings offers ad privacy choices when the law requires them", "no privacy choices row where none are required" RED→GREEN, suite 70+127
Final: fixed I3 Android biometric offered with weak biometrics, called "Face ID", silent failure on cancel — strong level only, generic Android name, setup error message; "Android: not offered with only weak biometrics", "Android: strong biometrics are named for Android, not Face ID", "a cancelled or failed set-up says so and leaves it off" RED→GREEN, suite 70+127
Final: fixed I4 two rewarded ads could load at once (surprise second ad) — single in-flight ad, all locked rows disabled; "one ad at a time" RED→GREEN, suite 70+127
Final: fixed I5 Android reminder channel badge — showBadge false; "Android: the reminder channel never puts a dot on the app icon" RED→GREEN, suite 70+127
Final: fixed I6 switching ads off only applied after 6 h — every cold start forces a fetch; "each cold start fetches fresh switches, even within 6 hours" RED→GREEN, suite 70+127
Final: minor (deferred): rewarded ad objects never destroy()ed — one native ad leaked per tap
Final: minor (deferred): if neither CLOSED nor ERROR arrives after show(), the busy state never clears (no post-show timeout)
Final: minor (deferred): report/plan wording fixed for "closing early" (no toast, by design)
Final: minor (deferred): Task 7 ledger ruling was wrong about Android (expo-secure-store returns null on KeyPermanentlyInvalidated → handled as "failed"); real gap is iOS after a new face enrolment/lockout → read throws → silent "cancelled" until re-enabled; a hint after repeated cancels would help
Final: minor (deferred): the old passcode item survives an iOS uninstall (Keychain); harmless (biometric-gated, device-only); could delete at start when the pref is absent
Final: minor (deferred): after Erase everything, in-memory flags/ready survive, so a banner could show behind the welcome
Final: minor (deferred): turning Face ID on re-runs unlockWithPasscode on an open vault (re-decrypts entries)
Final: minor (deferred): Face ID permission text is English only (needs Expo `locales` for vi)
Final: minor (deferred): live test doesn't assert anon update/delete errors explicitly
Final: minor (deferred): cached flags are trusted as stored (not re-validated)
