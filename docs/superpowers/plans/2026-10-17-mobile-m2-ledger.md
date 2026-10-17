# Mobile M2 — execution ledger
Spec: docs/superpowers/specs/2026-10-17-mindcocoon-mobile-design.md
Setup: branch feat/mobile-m2 off feat/mobile-m1 (M1 not merged yet — owner decides integration).
Setup: Ruling: Android not run in M2 (owner) — cost if wrong: Android-only issues surface later.
Pre-flight:
- T1→T2: entry imports ./src/bootstrap (stub in T1, real in T2) — consistent.
- T2→T3: prefs use the KV driver from T2 — consistent.
- T3→T4: theme persisted via prefs — consistent.
- T3/T4→T5: providers used by tabs/settings — consistent.
Task 1: Ruling: expo-router pinned (exact 58.0.23) in the ROOT devDependencies — npm kept nesting it under mobile/node_modules (tried dedupe, clean lock entries, legacy-peer-deps), where the hoisted @expo/cli cannot require expo-router/internal/testing → Metro crashed at start (owner's screenshot). Verified: Metro serves /mobile/index.ts.bundle (200, 7.5 MB) with EXPO_ROUTER_APP_ROOT inlined — cost if wrong: one unused devDependency in the web package; keep versions in sync.
Task 1: Ruling: mobile/eslint.config.js added (expo lint was picking up the web root config that ignores mobile/**); tsconfig extends expo/tsconfig.base.json (vite/oxc can't resolve the extensionless export) — cost if wrong: none.
Task 1: Ruling: simulator run handed to the owner (they asked to run it themselves); verified the iOS bundle builds via Metro instead — cost if wrong: a native-only issue shows up when they run it.
Task 1: complete (commits 814af47..e11fdaf, tests: npm test --prefix mobile →    Duration  96ms (import 49%, worker 18%, transform 16%, tests 16%, environment 1%))
Task 1: Ruling: mobile tests typechecked separately (test/tsconfig.json with Node types; 'npm run typecheck' runs both) — the Task 1 commit had slipped through with test type errors — cost if wrong: none.
Task 2: Ruling: device key API is createDeviceKeyStore(secure).getOrCreate()/clear() instead of a bare getOrCreateDeviceKey(secure) — needed to share one in-flight creation (same race fixed in M1) — cost if wrong: none.
Task 2: complete (commits 740658b..b4590a0, tests: npm test --prefix mobile →    Duration  125ms (import 38%, transform 28%, tests 26%, worker 8%))
Task 3: Ruling: no I18nProvider context — useI18n reads the prefs external store directly (fewer moving parts, same behaviour) — cost if wrong: none.
Task 3: complete (commits b4590a0..9c070d8, tests: npm test --prefix mobile →    Duration  136ms (import 38%, tests 33%, transform 20%, worker 8%))
Task 4: Ruling: theme via a useTheme() hook over prefs (no ThemeProvider), like useI18n — cost if wrong: none.
Task 4: Ruling: borders use rgba(r, g, b, a) on mobile (web uses CSS4 rgb(r g b / a)); the parity test normalises both to numbers; verified the test fails on a 1-digit colour change — cost if wrong: none.
Task 4: complete (commits 9c070d8..cc42fe7, tests: npm test --prefix mobile →    Duration  161ms (import 39%, tests 29%, transform 24%, worker 8%))
Task 5: Ruling: placeholder screens reuse existing dictionary lines (no new keys) — cost if wrong: none.
Task 5: Ruling: /dev/spike registered behind Stack.Protected guard={__DEV__} — never reachable in release builds — cost if wrong: none.
Task 5: Ruling: simulator screenshots handed to the owner (they are running the app; a parallel build would fight over port 8081/Xcode) — verified with typecheck (after regenerating typed routes), expo lint, unit tests — cost if wrong: a visual issue shows up in their run.
Task 5: complete (commits cc42fe7..f28aa37, tests: npm test --prefix mobile →    Duration  168ms (import 44%, tests 24%, transform 20%, worker 11%, environment 1%))
Task 6: Ruling: FOUND — the dev spike swapped core storage to memory for the whole app session (check 6); it now restores the real adapter and re-inits the vault — cost if wrong: none (dev-only screen).
Task 6: Ruling: simulator relaunch check written as owner steps in docs/mobile/M2-report.md (owner runs the simulator); persistence across launches is covered by unit tests (prefs reload, vault restore) — cost if wrong: a device-only persistence bug shows in their run.
Task 6: complete (commits f28aa37..5d63c0c, tests: npm test --prefix mobile →    Duration  139ms (import 38%, tests 30%, transform 22%, worker 10%))
Final review: opus — 'ready to merge, with fixes': 3 Important, several Minor.
Final: fixed I1 failed key read overwrote the device key — mobile 'never persists a replacement while a vault exists' RED→GREEN
Final: fixed I2 recovered vault locked on every launch — core 'unlocks once with the recovery code and then opens on its own again' + 're-wraps the one-hour reset path' RED→GREEN, mobile relaunch assertion RED→GREEN; suites web 164/164, mobile 22/22
Final: Ruling: Android android.allowBackup=false — restored SQLite without its Keystore key would strand no-passcode users without a recovery code; device moves rely on encrypted cloud backup — cost if wrong: Android users switching phones without signing in lose local data (same as uninstall).
Final: fixed I3 hoisting drift — install-layout guard test (verified it fails on a nested expo-* package)
Final: re-graded minor→important: Settings back button could read '(tabs)' (visible + VoiceOver) — title set on (tabs), minimal back button
Final: minor (deferred): loadPrefs rejection unhandled; setPref before load drops other stored keys (splash makes it unreachable)
Final: minor (deferred): secure-store throw shows 'locked' with no retry — add an 'unavailable' state before M3's forgot-passcode UI
Final: minor (deferred): userInterfaceStyle 'dark' keeps native alerts/keyboard dark in Mist
Final: minor (deferred): splash has no timeout; hide on onLayout instead of effect
Final: minor (deferred → M7): usesNonExemptEncryption=false, privacy manifest, real icons
Final: minor (deferred): token parity is one-way (only mapped tokens)
