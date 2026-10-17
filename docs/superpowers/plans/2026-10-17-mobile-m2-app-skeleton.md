# Mobile M2 — App skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Tóm tắt (VI):** Dựng khung app mobile: điều hướng 5 tab (Hôm nay, Trút bỏ, Cảm xúc, Nơi trú, Két riêng) + Cài đặt, theme Dusk/Mist cùng màu với web, font Newsreader/Hanken, song ngữ vi/en, lưu trữ SQLite và khóa thiết bị trong Keychain/Keystore. Kết quả kiểm chứng: mở app, đổi ngôn ngữ/giao diện, tắt app mở lại vẫn giữ; dữ liệu két còn nguyên sau khi tắt/mở. Android không chạy trong M2 (chủ dự án quyết).

**Goal:** A navigable, themed, bilingual Expo app whose data (vault, moods, preferences) persists on the device through `@mindcocoon/core`.

**Architecture:** Expo Router (`mobile/src/app/`) with a tab navigator. A custom entry `mobile/index.ts` imports `./src/polyfills` (crypto install) then `./src/bootstrap` (installs the SQLite storage adapter into core) and finally `expo-router/entry`. Platform adapters live in `mobile/src/lib/` and are unit-tested with Vitest against fakes of the Expo modules. UI reads core stores through `useSyncExternalStore` hooks exactly like the web.

**Tech Stack:** Expo SDK 58 (expo-router, expo-sqlite/kv-store, expo-secure-store, expo-localization, expo-font, expo-splash-screen, expo-system-ui), @expo-google-fonts/newsreader + hanken-grotesk, lucide-react-native + react-native-svg, Vitest (mobile unit tests).

**Spec:** `docs/superpowers/specs/2026-10-17-mindcocoon-mobile-design.md` (M2), product rules `docs/superpowers/specs/2026-10-16-mindcocoon-design.md` §4.6–4.7, §7.

## Global Constraints

- Read `mobile/AGENTS.md`; install Expo packages only with `npx expo install` (from `mobile/`); check SDK 58 docs (`https://docs.expo.dev/versions/v58.0.0/`) for every Expo API.
- Never edit `mobile/ios` or `mobile/android` by hand (generated; git-ignored).
- Strings come from `@mindcocoon/core/i18n/dictionaries/*` — add keys to both `en` and `vi` (core parity test must stay green).
- Colours must equal the web tokens in `app/globals.css` (Dusk = `.dark`, Mist = `:root`), incl. the validated mood palette.
- No streaks/counters/badges; dark (Dusk) is the default theme; respect "reduce motion" (`AccessibilityInfo.isReduceMotionEnabled`).
- Web must stay green: root `npm test`, `npm run typecheck`, `npm run build`.
- Mobile checks: `cd mobile && npx tsc --noEmit && npx expo lint && npm test`.
- Commit after every task (Conventional Commits + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`).

## Review Focus

1. **Device key lost but data restored** (Android backup restore, iOS restore without keychain): the vault must come up **locked** (recoverable with the recovery code), never silently create a fresh keyring over existing entries → test in Task 2.
2. **Polyfill order**: nothing may evaluate code that touches `crypto` before `install()` runs → Task 1 test asserts module order of the entry file.
3. **First launch before storage is ready**: screens must not read core stores before `setStorage(mobileAdapter)` → bootstrap runs in the entry before `expo-router/entry`; test in Task 2.
4. **Locale edge cases**: device language `vi-VN`, `en-GB`, `fr`, none → vi / en / en / en; an explicit choice wins and survives restart → Task 3.
5. **Theme drift from web**: token parity test parses `app/globals.css` → Task 4.

---

## File Map

```
mobile/
  index.ts                     entry: ./src/polyfills → ./src/bootstrap → expo-router/entry
  vitest.config.mts            node env, aliases fake expo modules in test/fakes
  src/polyfills.ts             react-native-quick-crypto install() at module scope
  src/bootstrap.ts             setStorage(createMobileAdapter())
  src/lib/kv-driver.ts         KVDriver over expo-sqlite/kv-store (JSON values, "mc:" prefix)
  src/lib/device-key.ts        getOrCreateDeviceKey via expo-secure-store (AFTER_FIRST_UNLOCK)
  src/lib/storage.ts           createMobileAdapter(): local adapter + secure device key
  src/lib/prefs.ts             small persisted prefs store (locale, theme) on the KV driver
  src/i18n/i18n.tsx            I18nProvider/useI18n for RN (locale from prefs → device → en)
  src/theme/tokens.ts          Dusk + Mist tokens (= web), mood colours, radii, type scale
  src/theme/theme.tsx          ThemeProvider/useTheme (persisted, default dusk)
  src/theme/fonts.ts           font map + useAppFonts()
  src/components/Screen.tsx    safe-area screen container + title
  src/app/_layout.tsx          root Stack; providers; splash until fonts + prefs ready
  src/app/(tabs)/_layout.tsx   5 tabs with lucide icons, settings button in header
  src/app/(tabs)/{index,vent,mood,sanctuary,vault}.tsx  placeholder screens (M3 fills them)
  src/app/settings.tsx         language + theme choices
  src/app/dev/spike.tsx        M1 spike + persistence check (only reachable in __DEV__)
  spike/                       (kept) run-spike.ts, vectors.json
  test/fakes/{expo-sqlite-kv-store,expo-secure-store,expo-localization}.ts
  test/*.test.ts
```

---

### Task 1: Expo Router, safe entry order, mobile test harness

**Files:** Modify `mobile/package.json` (main → `index.ts`, scripts `test`), `mobile/app.json` (plugins `expo-router`, `experiments.typedRoutes`), `mobile/tsconfig.json` (`@/*` → `./src/*`), `mobile/index.ts`. Create `mobile/src/polyfills.ts`, `mobile/vitest.config.mts`, `mobile/test/entry-order.test.ts`, `mobile/src/app/_layout.tsx` (minimal Stack), `mobile/src/app/dev/spike.tsx` (moves the M1 screen). Delete `mobile/App.tsx`.

**Interfaces:** Produces the `test` script (`vitest run`) and the entry contract: `index.ts` contains exactly, in order, `import "./src/polyfills"; import "./src/bootstrap"; import "expo-router/entry";` (bootstrap stub exports nothing until Task 2).

- [ ] **Step 1: Failing test** `entry-order.test.ts` reads `index.ts` text and asserts the three imports appear in that order and nothing else executes; and that `src/polyfills.ts` calls `install()` at top level.
- [ ] **Step 2:** `cd mobile && npm test` → FAIL.
- [ ] **Step 3:** `npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants` and `npm i -D vitest` in `mobile/`; implement the entry, polyfills, minimal root layout rendering the dev spike at `/dev/spike` and a temporary index route.
- [ ] **Step 4:** `npm test` → PASS; `npx tsc --noEmit`, `npx expo lint`, `npx expo-doctor` clean; `npx expo run:ios` → app opens; `/dev/spike` still shows ALL PASS (open via `xcrun simctl openurl booted "mindcocoon://dev/spike"`).
- [ ] **Step 5:** Commit `feat(mobile): expo-router with polyfill-first entry and unit test harness`.

### Task 2: Mobile storage adapter (SQLite + Keychain)

**Files:** Create `mobile/src/lib/{kv-driver,device-key,storage}.ts`, `mobile/src/bootstrap.ts`, `mobile/test/fakes/{expo-sqlite-kv-store,expo-secure-store}.ts`, `mobile/test/storage.test.ts`.

**Interfaces:**
- `createKvDriver(store = Storage): KVDriver` — keys namespaced `mc:`; values JSON-encoded; `keys()` returns un-prefixed keys.
- `getOrCreateDeviceKey(secure = SecureStore): Promise<CryptoKey>` — reads base64 of 32 bytes from key `mc.device-key` with `{ keychainAccessible: AFTER_FIRST_UNLOCK }`; if absent generates `crypto.getRandomValues(32)`, stores, returns `importDek(raw)` (non-extractable AES-GCM).
- `createMobileAdapter(): StorageAdapter` — `createLocalAdapter(createKvDriver())` with `vaultKeys.getOrCreateDeviceKey` replaced and `vaultKeys.clear` also deleting `mc.device-key`.
- `bootstrap.ts`: `setStorage(createMobileAdapter())` at module scope.

- [ ] **Step 1: Failing tests** (node env, `@mindcocoon/core` session/keyring with `__setIterationsForTests(1000)`, fakes in memory):
  - driver: set/get round-trips objects; `keys()` lists only `mc:` keys without the prefix; `del` removes.
  - device key: same key across two calls (encrypt with first, decrypt with second); generates once.
  - **Review Focus 1:** `initVault()` + `saveVaultEntry()`, then wipe only the fake secure store (simulated restore), reset vault module, `initVault()` again → `status === "locked"`, stored journal still has the entry, and `unlockWithRecoveryCode(code)` (code made before the wipe via `regenerateRecoveryCode`) → `true` with the entry readable.
  - **Review Focus 3:** importing `src/bootstrap` makes `getStorage()` return the mobile adapter.
- [ ] **Step 2:** FAIL. **Step 3:** `npx expo install expo-sqlite expo-secure-store`; implement. **Step 4:** PASS + checks.
- [ ] **Step 5:** Commit `feat(mobile): SQLite storage and Keychain device key for core`.

### Task 3: Bilingual UI plumbing

**Files:** Create `mobile/src/lib/prefs.ts`, `mobile/src/i18n/i18n.tsx`, `mobile/test/fakes/expo-localization.ts`, `mobile/test/i18n.test.ts`.

**Interfaces:**
- `prefs`: `getPref<K extends "locale" | "theme">(k)`, `setPref(k, v)`, `subscribePrefs(listener)`, `loadPrefs(): Promise<void>` (reads from the KV driver once at startup).
- `deviceLocale(locales = getLocales()): Locale` — first `languageCode` that is `vi`/`en`, else `en`.
- `<I18nProvider>` / `useI18n(): { locale, t: Dictionary, setLocale(l) }` — locale = saved pref ?? `deviceLocale()`.

- [ ] **Step 1: Failing tests:** `deviceLocale` for `[vi-VN]`→vi, `[en-GB]`→en, `[fr-FR, vi-VN]`→vi, `[fr]`→en, `[]`→en; saved `en` wins over device `vi`; `setLocale("vi")` persists through `loadPrefs()` on a fresh prefs module (same fake KV).
- [ ] **Step 2–4:** `npx expo install expo-localization`; FAIL → implement → PASS.
- [ ] **Step 5:** Commit `feat(mobile): locale detection, persisted prefs and i18n provider`.

### Task 4: Theme and fonts

**Files:** Create `mobile/src/theme/{tokens,theme,fonts}.ts(x)`, `mobile/test/tokens.test.ts`.

**Interfaces:**
- `tokens.dusk` / `tokens.mist`: `{ background, foreground, surface, card, primary, primaryForeground, muted, mutedForeground, border, ember, destructive, mood: Record<MoodType,string> }` with the exact hex values of `app/globals.css` (`.dark` → dusk, `:root` → mist; `--border` as rgba strings).
- `fonts`: `serif` = Newsreader 400, `serifItalic`, `sans` = HankenGrotesk 400, `sansMedium` 500, `sansSemibold` 600; `useAppFonts(): boolean`.
- `<ThemeProvider>` / `useTheme(): { name: "dusk"|"mist", c: typeof tokens.dusk, setTheme }` — default `dusk`, persisted via prefs.

- [ ] **Step 1: Failing test** `tokens.test.ts` parses `../app/globals.css` (`:root{…}` and `.dark{…}` blocks) and asserts every mapped variable equals the token (case-insensitive hex).
- [ ] **Step 2–4:** `npx expo install expo-font expo-splash-screen expo-system-ui @expo-google-fonts/newsreader @expo-google-fonts/hanken-grotesk`; FAIL → implement → PASS. Root layout keeps the splash screen until `useAppFonts()` and `loadPrefs()` are done; `SystemUI.setBackgroundColorAsync(c.background)`.
- [ ] **Step 5:** Commit `feat(mobile): Dusk/Mist theme tokens matching web, fonts and splash`.

### Task 5: Tabs, Settings and placeholder screens

**Files:** Create `mobile/src/components/Screen.tsx`, `mobile/src/app/(tabs)/_layout.tsx`, the five tab screens, `mobile/src/app/settings.tsx`; modify `mobile/src/app/_layout.tsx` (providers + Stack: `(tabs)`, `settings`, `dev/spike` only when `__DEV__`); core dictionaries (add `mobile.placeholder` keys if needed — both languages).

**Interfaces:**
- Tabs (order, labels from `t.nav`): `index` Today (Sunrise), `vent` (Feather), `mood` (Waves), `sanctuary` (Leaf), `vault` (BookLock) — lucide-react-native icons, active tint `c.primary`, background `c.background`, top border `c.border`.
- Header: app name in Newsreader, right button (Settings2) → `/settings`.
- Settings: two radio groups (language: Tiếng Việt/English; appearance: `t.settings.themeDusk`/`themeMist`) with `accessibilityRole="radio"` + `accessibilityState.checked`.
- Placeholder screens show the tab title in Newsreader and one muted line (`t.today.checkinQuestion` on Today, etc.) — real content arrives in M3.

- [ ] **Step 1:** `npx expo install lucide-react-native react-native-svg`; build the screens.
- [ ] **Step 2:** `npx tsc --noEmit && npx expo lint && npm test` clean.
- [ ] **Step 3:** `npx expo run:ios`; screenshots `docs/mobile/m2-today.png` (vi, Dusk) and `docs/mobile/m2-settings-mist-en.png` after switching to English + Mist.
- [ ] **Step 4:** Commit `feat(mobile): tab navigation, settings and themed placeholder screens`.

### Task 6: Persistence check on the simulator

**Files:** Modify `mobile/src/app/dev/spike.tsx` (add a "persistence" section), create `docs/mobile/M2-report.md`.

**Interfaces:** the dev screen shows: vault status, number of journal entries, current locale/theme; a button "Add test entry" (saves `"m2 persistence <ISO>"` via `saveVaultEntry`).

- [ ] **Step 1:** On the simulator: open `/dev/spike`, add an entry, switch to English + Mist in Settings, then `xcrun simctl terminate booted app.mindcocoon` and relaunch.
- [ ] **Step 2:** After relaunch the app is in English + Mist and the dev screen shows the vault `unlocked` with the entry count unchanged. Screenshot `docs/mobile/m2-persisted.png`.
- [ ] **Step 3:** Write `docs/mobile/M2-report.md` (what was verified, screenshots, open items: Android not run per owner; PBKDF2 to re-measure on a physical iPhone).
- [ ] **Step 4:** Commit `docs(mobile): M2 persistence check and report`.
