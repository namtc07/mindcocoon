# Mobile M1 — Shared core + crypto spike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Tóm tắt (VI):** Tách phần lõi TypeScript của bản web sang `packages/core` để app mobile dùng chung (web phải giữ nguyên 153 test xanh, build và E2E sạch), tạo app Expo trong `mobile/`, rồi chạy **bản thử mã hóa** trên iOS Simulator và Android để quyết định **làm tiếp (go)** hay **đổi sang phương án `@noble` (no-go)**. Điều kiện "go": mọi phép kiểm trên máy đều đạt, kết quả mã hóa khớp từng byte với Node/web, và PBKDF2 310 000 vòng không quá chậm.

**Goal:** One shared, platform-free `@mindcocoon/core` package used by the web app, and a go/no-go answer on running that core's WebCrypto code inside an Expo (React Native) app.

**Architecture:** npm workspaces at the repo root (`packages/*`, `mobile`). The Next.js app stays at the root and imports `@mindcocoon/core/<module>` (TypeScript source, transpiled by Next via `transpilePackages`). Platform specifics stay behind existing interfaces (`KVDriver`, `VaultKeyRepository`); anything touching `window`/`document`/`localStorage`/`navigator` stays in the web app. The Expo app polyfills `global.crypto` with `react-native-quick-crypto` and runs a self-test screen against test vectors produced by Node.

**Tech Stack:** npm workspaces, TypeScript 5, Vitest, Next.js 16.4, Expo SDK 58 (dev client, prebuild), react-native-quick-crypto 1.1.x + react-native-nitro-modules + react-native-quick-base64, Xcode 26.3 / iOS Simulator.

**Spec:** `docs/superpowers/specs/2026-10-17-mindcocoon-mobile-design.md` (sections 2–3, 8 M1). Product rules: `docs/superpowers/specs/2026-10-16-mindcocoon-design.md`.

## Global Constraints

- The web app must stay fully working: `npm test` (153+), `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e` all green after every task.
- `packages/core` must not reference `window`, `document`, `localStorage`, `sessionStorage`, `navigator` or any `next/*` / `react` import (enforced by a test in Task 2).
- Encrypted formats must not change: envelopes stay `v1.<iv>.<ciphertext>`, PBKDF2-SHA256 310 000 iterations, AES-GCM 256, 12-word BIP39 English recovery codes. Data written by the web must open on mobile and vice versa.
- No secrets in `mobile/` source; Supabase keys are not needed in M1.
- Commit after every task (Conventional Commits + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`).
- Read `node_modules/next/dist/docs/` before touching Next config (Next 16 differs from training data).

## Review Focus

1. **Silent format drift:** a moved module that changes default iterations, envelope encoding or base64 handling would make old journals unreadable → Task 2 adds golden test vectors (fixed DEK/salt/passcode → known ciphertext decrypts, known PBKDF2 output) that must pass before and after the move.
2. **Web storage regression:** the device key on web must remain a non-extractable `CryptoKey` in IndexedDB after the `getOrCreateDeviceKey` refactor → test in Task 2.
3. **Auto-lock regression:** moving auto-lock out of the vault session must keep the 5-minute idle/hidden-tab lock on web → test in Task 2.
4. **Two React copies / Metro resolution in the monorepo:** Expo must resolve one `react` and `react-native` → Task 3 verifies `npx expo-doctor` and a running app.
5. **Simulator ≠ phone:** PBKDF2 timing on the Mac-backed simulator under-reports real devices → Task 4 records it as provisional; Task 5 measures on an Android device/emulator; final iPhone timing is checked in M2 on a real device.

---

## File Map

```
package.json                     + "workspaces": ["packages/*", "mobile"]
next.config.ts                   + transpilePackages: ["@mindcocoon/core"]
vitest.config.mts                + include packages/core/test/**
packages/core/
  package.json                   name @mindcocoon/core, "exports": { "./*": "./src/*.ts" }, private
  tsconfig.json
  src/types.ts                   ← types/index.ts
  src/crypto.ts                  ← lib/crypto.ts
  src/storage/{driver,repositories,local,index}.ts ← lib/storage/*
  src/vault/{keyring,session}.ts ← lib/vault/* (auto-lock removed from session)
  src/mood/{store,selectors}.ts  ← lib/mood/*
  src/backup/{snapshot,engine,remote,supabase-remote}.ts ← lib/backup/* (active.ts & prefs.ts stay web)
  src/{moods,dates,prompts,breathing,sounds}.ts ← lib/*
  src/audio/tonight.ts           ← lib/audio/tonight.ts
  src/ads/config.ts              ← lib/ads/config.ts
  src/safety/{detect,phrases,hotlines}.ts ← lib/safety/*
  src/i18n/{config,get-dictionary}.ts + src/i18n/dictionaries/{en,vi}.ts ← lib/i18n/*
  test/                          ← the moved modules' unit tests (+ golden vectors, purity test)
lib/vault/auto-lock.ts           (web) new — idle/hidden-tab locking using core exports
mobile/                          Expo app (create-expo-app, blank-typescript)
  app.json                       + react-native-quick-crypto plugin, expo-dev-client
  index.ts                       QuickCrypto.install() before anything else
  App.tsx                        spike screen (Task 4)
  spike/vectors.json             generated by scripts/make-crypto-vectors.mjs
  spike/run-spike.ts             runs every check, returns { name, ok, ms, detail }[]
scripts/make-crypto-vectors.mjs  Node: writes mobile/spike/vectors.json from core
docs/mobile/M1-spike-report.md   results + go/no-go decision
```

Web-only modules that stay in `lib/`: `storage` IndexedDB bootstrap is in core (`createDefaultDriver` already detects `indexedDB`), `lib/auth/*`, `lib/analytics.ts`, `lib/data.ts`, `lib/pwa.ts`, `lib/audio/engine.ts`, `lib/backup/{active,prefs}.ts`, `lib/supabase/client.ts`, `lib/utils.ts`.

---

### Task 1: Workspace + empty core package

**Files:**
- Modify: `package.json`, `next.config.ts`, `vitest.config.mts`, `tsconfig.json` (paths)
- Create: `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/src/version.ts`, `packages/core/test/version.test.ts`

**Interfaces:**
- Produces: package `@mindcocoon/core` resolvable from the web app as `@mindcocoon/core/<path>` (TypeScript source); `CORE_VERSION = "0.1.0"` export to prove wiring.

- [ ] **Step 1: Failing test** `packages/core/test/version.test.ts`: `import { CORE_VERSION } from "@mindcocoon/core/version"; expect(CORE_VERSION).toBe("0.1.0")`.
- [ ] **Step 2:** `npm test` → FAIL (cannot resolve). 
- [ ] **Step 3:** Add `"workspaces": ["packages/*"]` (add `mobile` in Task 3), `packages/core/package.json` (`"name": "@mindcocoon/core"`, `"private": true`, `"type": "module"`, `"exports": { "./*": "./src/*.ts" }`, peer deps: `@scure/bip39`, `idb-keyval`, `@supabase/supabase-js` moved here as dependencies with the web's exact versions), `npm install`; `next.config.ts` → `transpilePackages: ["@mindcocoon/core"]` (check `node_modules/next/dist/docs/01-app/03-api-reference/05-config/` for the option); `vitest.config.mts` include `packages/core/test/**/*.test.{ts,tsx}`.
- [ ] **Step 4:** `npm test` → PASS; `npm run typecheck && npm run build` → clean.
- [ ] **Step 5:** Commit `chore(core): npm workspaces and @mindcocoon/core package`.

### Task 2: Move platform-free modules into core

**Files:** moves per the File Map (use `git mv` so history follows), plus:
- Modify: `packages/core/src/storage/repositories.ts` + `local.ts` (`getOrCreateDeviceKey`), `packages/core/src/vault/session.ts` (remove auto-lock; export `isIdleTooLong(since, now, state)`), `packages/core/src/backup/engine.ts` (use `getOrCreateDeviceKey`)
- Create: `lib/vault/auto-lock.ts` (web), `packages/core/test/golden-vectors.test.ts`, `packages/core/test/purity.test.ts`, `packages/core/test/auto-lock.test.ts`, `tests/unit/web-device-key.test.ts`
- Every web import of a moved module → `@mindcocoon/core/<path>` (codemod with `sed`, then fix by `npm run typecheck`).

**Interfaces:**
- Produces (core): every moved module at `@mindcocoon/core/<same relative path>`, e.g. `@mindcocoon/core/vault/session`, `@mindcocoon/core/i18n/dictionaries/en`, `@mindcocoon/core/types`.
- Changes: `VaultKeyRepository` loses `getDeviceKey/setDeviceKey`, gains `getOrCreateDeviceKey(): Promise<CryptoKey>` (web/local adapter: read IndexedDB, else `generateDeviceKey()` non-extractable and store). Session and backup engine call only this.
- `isIdleTooLong(since: number, now: number, s: Pick<VaultState,"hasPasscode"|"status"|"autoLockMinutes">): boolean`; web `startVaultAutoLock()` moves to `lib/vault/auto-lock.ts` with the same behaviour (pointer/key/scroll activity, visibilitychange, 30 s interval).

- [ ] **Step 1: Golden vectors first (on the current code, before moving):** `scripts/make-crypto-vectors.mjs` is not needed yet — write `golden-vectors.test.ts` (node env) with fixed inputs and assert:
  - `deriveKeyFromSecret("2468", <fixed salt b64>, 310000)` then `encryptBytes`/`decryptBytes` round-trips, and `crypto.subtle.deriveBits` of the same PBKDF2 params equals a hard-coded hex (compute once, paste).
  - `decryptString(importDek(<fixed 32 bytes>), "<fixed v1 envelope>")` === `"golden"` (generate the envelope once, paste).
  - `unlockWithRecoveryCode({ version:1, recovery:<fixed KdfWrap>, autoLockMinutes:5 }, "<fixed 12 words>")!.raw` equals the fixed DEK.
  Run it against today's `lib/` paths → PASS (it pins current behaviour).
- [ ] **Step 2: Failing tests for the new seams:** `purity.test.ts` scans `packages/core/src/**/*.ts` text and fails on `/\b(window|document|localStorage|sessionStorage|navigator)\b/` or `from "react"`/`from "next/`; `auto-lock.test.ts` asserts `isIdleTooLong` (passcode+unlocked+6 min idle with autoLock 5 → true; no passcode → false; locked → false); `web-device-key.test.ts` asserts the local adapter's `getOrCreateDeviceKey()` returns the same key twice and `key.extractable === false`. Run → FAIL (modules not there).
- [ ] **Step 3:** `git mv` the modules and their tests, apply the interface changes, run the import codemod, update the golden test's imports to `@mindcocoon/core/*`.
- [ ] **Step 4:** `npm test` (all, incl. golden vectors) → PASS; `npm run typecheck && npm run lint && npm run build && npm run test:e2e` → clean. `grep -rn "@/lib/\(crypto\|vault/keyring\|mood/store\)" app components hooks lib` → no hits.
- [ ] **Step 5:** Commit `refactor(core): move platform-free modules into @mindcocoon/core`.

### Task 3: Expo app shell in `mobile/`

**Files:**
- Create: `mobile/` via `npx create-expo-app@latest mobile --template blank-typescript --no-install`
- Modify: root `package.json` workspaces (+ `mobile`), `mobile/package.json` (`"@mindcocoon/core": "*"`), `mobile/app.json` (name MindCocoon, slug `mindcocoon`, scheme `mindcocoon`, `ios.bundleIdentifier` / `android.package` = `app.mindcocoon`, `userInterfaceStyle: "dark"`, plugins: `["react-native-quick-crypto"]`), `mobile/index.ts`, `.gitignore` (`mobile/ios`, `mobile/android`, `.expo`)

**Interfaces:**
- Produces: a dev-client build that renders a screen importing `@mindcocoon/core/prompts` and showing today's prompt (proves Metro resolves the workspace package).

- [ ] **Step 1:** Scaffold, `npm install` at the root, `cd mobile && npx expo install expo-dev-client react-native-quick-crypto react-native-nitro-modules react-native-quick-base64`.
- [ ] **Step 2:** `mobile/index.ts`: `import { install } from "react-native-quick-crypto"; install();` as the first statement, then register the root component. `App.tsx` renders `promptForDay(new Date(), "vi")`.
- [ ] **Step 3:** `npx expo-doctor` → no errors (watch for duplicate `react`/`react-native`; fix with Metro `resolver` only if doctor reports it).
- [ ] **Step 4:** `npx expo prebuild --platform ios && npx expo run:ios --device "iPhone 17 Pro"` → app launches; `xcrun simctl io booted screenshot docs/mobile/m1-shell.png` shows the Vietnamese prompt.
- [ ] **Step 5:** Root `npm test`, `npm run build` still green (the mobile workspace must not break web tooling). Commit `feat(mobile): Expo app shell sharing @mindcocoon/core`.

### Task 4: Crypto spike on iOS (go/no-go)

**Files:**
- Create: `scripts/make-crypto-vectors.mjs`, `mobile/spike/vectors.json`, `mobile/spike/run-spike.ts`, `docs/mobile/M1-spike-report.md`
- Modify: `mobile/App.tsx` (spike screen)

**Interfaces:**
- Consumes: core `crypto`, `vault/keyring`, `vault/session` (with `setStorage(createLocalAdapter(createMemoryDriver()))`), `backup/snapshot`.
- Produces: `runSpike(vectors): Promise<{ name: string; ok: boolean; ms: number; detail?: string }[]>`; the screen lists each check and a final `ALL PASS` / `FAILED` line.

Checks (each must be `ok`):
1. `crypto.subtle` exists after `install()`; `crypto.getRandomValues` fills 32 bytes.
2. PBKDF2 310 000 → `deriveBits` equals the Node vector hex; record `ms`.
3. AES-GCM decrypts the Node-made envelope to the vector plaintext (Node → phone).
4. Phone encrypts, then decrypts its own envelope (round trip) and the envelope parses as `v1.<iv>.<ct>`.
5. `unlockWithRecoveryCode` opens the Node-made recovery wrap → DEK equals the vector DEK.
6. Full session: `initVault()` (memory storage; device key via `getOrCreateDeviceKey` — for the spike, a memory implementation), save entry, `setVaultPasscode`, lock, unlock with passcode, `encryptField`/`decryptField`.
7. `sealSnapshot` → `openSnapshot` round trip.
8. Phone → Node: the screen shows a short envelope string of `"from-phone"` encrypted with the vector DEK; paste it into the report and verify with `node scripts/make-crypto-vectors.mjs --verify "<envelope>"` → prints `from-phone`.

- [ ] **Step 1:** `scripts/make-crypto-vectors.mjs` (Node, imports core via `tsx`-free path: compile with `npx tsc` to a temp dir, or re-implement the 5 primitive calls with Node WebCrypto directly) writes `vectors.json` (`{ dekHex, envelope, plaintext, saltB64, passcode, pbkdf2Hex, recovery: KdfWrap, recoveryCode }`) and supports `--verify <envelope>`.
- [ ] **Step 2:** Write `run-spike.ts`; run the app on the simulator → initially expect failures to be visible on screen if anything is missing (that is the RED for a spike).
- [ ] **Step 3:** Fix wiring only (polyfill order, base64, Buffer) — never change the crypto formats. Re-run until the screen shows `ALL PASS`; screenshot `docs/mobile/m1-spike-ios.png`.
- [ ] **Step 4:** Record in `docs/mobile/M1-spike-report.md`: each check, PBKDF2 ms (simulator, provisional), the phone→Node verification output, decision **GO** (all pass and PBKDF2 < 3 s) or **NO-GO** (switch to `@noble/hashes` + `@noble/ciphers` behind a `CryptoProvider` — separate plan).
- [ ] **Step 5:** Commit `feat(mobile): crypto spike screen and M1 report (iOS)`.

### Task 5: Android check

**Files:**
- Modify: `docs/mobile/M1-spike-report.md`

- [ ] **Step 1 (needs the owner's OK — installs ~5 GB):** install Android command-line tools + an emulator image (`brew install --cask android-commandlinetools`, `sdkmanager "platform-tools" "emulator" "system-images;android-35;google_apis;arm64-v8a"`, create an AVD) **or**, if the owner prefers, build in the cloud with `eas build --profile development --platform android` (needs the Expo account from M0) and install on a real Android phone.
- [ ] **Step 2:** `npx expo run:android` (or install the EAS build) → spike screen `ALL PASS`; screenshot `docs/mobile/m1-spike-android.png`; add PBKDF2 ms to the report.
- [ ] **Step 3:** Final decision line in the report (GO/NO-GO for both platforms). Commit `docs(mobile): M1 spike results on Android`.
