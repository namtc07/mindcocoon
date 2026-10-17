# Mobile M1 — execution ledger
Spec: docs/superpowers/specs/2026-10-17-mindcocoon-mobile-design.md
Setup: branch feat/mobile-m1 in the main checkout (same as v1).
Setup: Ruling: owner said "code first, I'll test on the emulator myself" — Task 5 (Android) is left to the owner; iOS simulator run in Task 3/4 is attempted because the tools exist — cost if wrong: extra build time.
Pre-flight:
- T1→T2: @mindcocoon/core/* import path produced by T1, consumed by T2 codemod — consistent.
- T2→T4: getOrCreateDeviceKey (T2) used by the spike session (T4) — consistent.
- T2→T3: core purity test guarantees no DOM globals before Metro bundles it — consistent.
Task 1: Ruling: no transpilePackages — Next 16 docs: Turbopack transpiles workspace packages automatically — cost if wrong: add one config line if a build fails.
Task 1: complete (commits 8f98b11..0f0950d, tests: npm test →              learn more: https://vitest.dev/guide/improving-performance#test-environments)
Task 2: Ruling: golden vectors generated with Node WebCrypto directly (fixed DEK/IV/salt) and stored in packages/core/test/golden-vectors.json so the mobile spike reuses the same file — cost if wrong: none.
Task 2: Ruling: core-internal imports are relative (not @mindcocoon/core self-references) so Metro never needs package self-resolution — cost if wrong: none.
Task 2: Ruling: device-key test proves identity by encrypt-with-first/decrypt-with-second (toStrictEqual on CryptoKey compares only properties) — cost if wrong: none.
Task 2: Ruling: purity scan ignores comments and string contents ("Rain on the window"); verified it still fails on a real `window.alert` — cost if wrong: none.
Task 2: Ruling: createDefaultDriver checks only `typeof indexedDB` (was also `window`) — React Native gets the memory driver until the app installs SQLite — cost if wrong: none.
Task 2: complete (commits 0f0950d..31a0bf7, tests: npm test →              learn more: https://vitest.dev/guide/improving-performance#test-environments)
Task 3: Ruling: mobile/ excluded from the root tsconfig and ESLint (it has its own tsconfig/expo lint); typechecked with `cd mobile && npx tsc --noEmit` — cost if wrong: none.
Task 3: Ruling: removed the template's MIT LICENSE (Expo's copyright) from mobile/ — the owner hasn't chosen a licence — cost if wrong: none.
Task 3: Verified: expo-doctor 20/20; single react@19.3.0 (Expo 58 pins the same version as the web); iOS dev build succeeded (0 errors) and launched on iPhone 17 Pro simulator.
Task 3+4: Ruling: committed together (App.tsx shows the prompt and the spike in one screen) — cost if wrong: one larger commit.
Task 4: Verified: iOS ALL PASS 8/8; PBKDF2 310k = 32–44 ms (simulator, provisional); phone envelope decrypts in Node ('from-phone'). Decision iOS GO.
Task 5: Ruling: not executed — owner will run Android on an emulator themselves (their instruction); report marks Android as pending with the exact command.
Task 3: complete (commits 31a0bf7..0050b0d, tests: npm test →              learn more: https://vitest.dev/guide/improving-performance#test-environments)
Task 4: complete (commits 31a0bf7..0050b0d, tests: npm test →              learn more: https://vitest.dev/guide/improving-performance#test-environments)
Final review: opus — 'ready to merge with minor fixes', no Critical/Important.
Final: re-graded minor→important: concurrent getOrCreateDeviceKey could create two keys (vault wrap pointing at a lost key) — 'creates only one device key when asked twice at the same time' RED→GREEN, suite 162/162
Final: fixed report wording — iOS GO scoped to the simulator; real device + Keychain in M2
Final: minor (deferred → M2 Task 1): polyfill install() runs after hoisted imports; move to polyfills.ts imported first
Final: minor (deferred): wipe during the very first initVault can leave a stray (harmless) device key
Final: minor (deferred): pin PBKDF2_ITERATIONS and envelope shape in the golden test
Final: minor (deferred): commit the golden-vector generator (vectors are independently re-derived by the reviewer)
Final: minor (deferred → M6): core ads/config reads NEXT_PUBLIC_* (undefined on mobile) — make it a parameter
Final: minor (deferred): react-native-quick-crypto ^1.1.8 — lockfile pins today; pin exactly before release
Final: Ruling: mobile/AGENTS.md and mobile/.claude/settings.json kept on purpose (Expo docs guidance; enables the official Expo plugin) — cost if wrong: none.
