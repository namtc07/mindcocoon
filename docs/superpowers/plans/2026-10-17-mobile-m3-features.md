# Mobile M3 — Feature parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Tóm tắt (VI):** Đưa các tính năng chính của web lên app: Hôm nay (câu gợi mở, check-in một chạm), Trút bỏ toàn màn hình + hiệu ứng tan chữ (Reanimated) + cất vào két, Két riêng (mã khóa, mã khôi phục, quên mã, tự khóa khi app chạy nền), Cảm xúc (form, dải tuần, lịch tháng, lịch sử), An toàn (thẻ nhắc nhẹ, trang hỗ trợ), Cài đặt đầy đủ (xuất dữ liệu, xóa toàn bộ, thông báo lần đầu). Logic dùng lại 100% từ `@mindcocoon/core`; test component bằng jest-expo + Testing Library. Nơi trú (âm thanh) là M4; tài khoản/sao lưu là M5; quảng cáo/Pro là M6.

**Goal:** The phone app does everything the web v1 does except audio, accounts/backup and ads — with the same rules (no counters, safety first, encryption unchanged).

**Architecture:** Screens in `mobile/src/app/**` compose small components in `mobile/src/components/**`; all state comes from core stores (`vault/session`, `mood/store`, selectors, safety, prompts) through hooks in `mobile/src/hooks/`. Component tests run under jest-expo with Testing Library (in-memory core storage); pure adapter tests stay on Vitest.

**Tech Stack:** Expo SDK 58, expo-router, react-native-reanimated 4.7, expo-haptics, expo-sharing + expo-file-system (export), jest-expo ~58.0.11, @testing-library/react-native 14.

**Spec:** `docs/superpowers/specs/2026-10-17-mindcocoon-mobile-design.md` (M3); behaviour from `docs/superpowers/specs/2026-10-16-mindcocoon-design.md` §4.1–4.4, §4.7, §8; review findings carried from M2 (`docs/superpowers/plans/2026-10-17-mobile-m2-ledger.md`).

## Global Constraints

- Every rule of the web spec applies: released text is never stored/logged; private content only as `v1.` envelopes; no streaks/counters/badges/scores; gentle card at most once per session; ads never on vent/vault/breathing/after-release/help (no ads in M3 at all).
- Strings only from core dictionaries (add keys to `en` and `vi`; parity test must pass). Reuse existing keys wherever the web already has them.
- Colours from `useTheme().c`, fonts from `fonts`; respect Reduce Motion (`useReducedMotion()` from reanimated).
- Accessibility: every pressable has `accessibilityRole` + label; mood dots are `radio`s with `checked` state; minimum touch target 44 pt.
- Run from `mobile/`: `npm test` (Vitest + Jest), `npm run typecheck`, `npx expo lint`; web stays green (`npm test` at root).
- Install Expo packages only with `npx expo install`; the install-layout guard test must stay green.
- Commit after every task (Conventional Commits + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`).

## Review Focus

1. **Vent privacy on mobile:** released text must not survive in component state, the TextInput's native undo, iOS autocorrect/keyboard learning or app-switcher snapshots → release clears state and remounts the input; the input uses `autoCorrect={false}`, `spellCheck={false}`, `autoComplete="off"`; the vent screen hides content when the app goes to background → Task 4 test + AppState check.
2. **Locked vault + note** (Today and Mood): never store a plaintext note; ask for the passcode inline → Tasks 3, 6.
3. **Keychain read failure ≠ locked:** a secure-store throw shows an "unavailable — try again" state with retry, never the forgot-passcode reset flow → Task 5 (M2 deferred minor).
4. **Auto-lock on mobile:** a passcode vault locks after N minutes in background (AppState) and on cold start → Task 5.
5. **Erase everything** removes SQLite data, the Keychain key and prefs, and the app returns to a fresh first-run state → Task 7.

---

## File Map

```
mobile/jest.config.js, mobile/jest.setup.ts         jest-expo preset, WebCrypto, fakes for sqlite/secure-store/haptics
mobile/src/test-utils/render.tsx                     renderWithApp() — in-memory core storage + reset stores
mobile/src/hooks/{use-now,use-mood-logs,use-vault,use-app-state}.ts
mobile/src/components/ui/{Button,Chip,TextField,Sheet,Toast}.tsx
mobile/src/components/mood/{MoodPicker,WeekStrip,MonthHeatmap,MoodHistory,CheckinForm}.tsx
mobile/src/components/today/{ReflectionPrompt,QuickCheckin,EntryLinks}.tsx
mobile/src/components/vent/{VentEditor,Dissolve,AfterRelease,SaveSheet}.tsx
mobile/src/components/safety/{GentleCard,HelpLink,HeavyNudge}.tsx
mobile/src/components/vault/{UnlockPanel,ForgotPasscode,PasscodeForm,RecoveryCodeCard,VaultSettingsSheet,EntryReader}.tsx
mobile/src/lib/{auto-lock,export}.ts
mobile/src/app/(tabs)/{index,vent,mood,vault}.tsx    real screens
mobile/src/app/help.tsx, mobile/src/app/settings.tsx (extended)
mobile/__tests__/*.test.tsx                           Jest component tests
```

---

### Task 1: Component test harness + shared UI kit

**Files:** `jest.config.js`, `jest.setup.ts`, `src/test-utils/render.tsx`, `src/components/ui/*`, `src/hooks/use-now.ts`, `__tests__/ui.test.tsx`; `package.json` scripts: `"test": "vitest run && jest"`, `"test:unit": "vitest run"`, `"test:ui": "jest"`.

**Interfaces:** `renderWithApp(ui, { locale?: Locale, theme?: ThemeName })` sets an in-memory core storage (`createLocalAdapter(createMemoryDriver())`), resets vault/mood stores, sets prefs, returns RNTL utils. UI kit: `<Button variant="primary"|"ghost"|"ember"|"outline" onPress accessibilityLabel? disabled>`, `<Chip selected onPress>`, `<TextField label secure? multiline? />` (label = accessibilityLabel), `<Sheet visible onClose title>` (RN `Modal`, slide, dimmed backdrop), `toast.show(text)` + `<ToastHost/>`.

- [ ] Step 1: failing `ui.test.tsx` — Button calls onPress and is not pressable when disabled; Chip exposes `accessibilityState.selected`; TextField label finds the input; toast text appears then disappears after 2.5 s (fake timers).
- [ ] Step 2: FAIL. Step 3: `npx expo install jest-expo -- --save-dev` + `npm i -D @testing-library/react-native@14`; jest.setup: `globalThis.crypto ??= require("node:crypto").webcrypto`, mock `expo-haptics`, `expo-sqlite/kv-store`, `expo-secure-store` with the M2 fakes; implement. Step 4: PASS + typecheck/lint.
- [ ] Step 5: Commit `test(mobile): jest-expo harness and shared UI kit`.

### Task 2: Mood picker + safety components

**Files:** `src/components/mood/MoodPicker.tsx`, `src/components/safety/{GentleCard,HelpLink,HeavyNudge}.tsx`, `src/hooks/use-mood-logs.ts`, `__tests__/mood-picker.test.tsx`, `__tests__/safety.test.tsx`.

**Interfaces:** `<MoodPicker value onChange label size="md"|"lg">` (5 radios, colour dots `c.mood[id]`, labels from `t.mood.states`); `<GentleCard visible continueLabel onContinue onClose>` (copy `t.safety.cardMessage`, "Call a support line" → `/help`); `claimGentleCard()` re-exported from a mobile module-level flag (once per app session); `<HeavyNudge now>` (core `shouldShowHeavyNudge`, last-shown in prefs `heavyNudgeAt`).

- [ ] Steps: failing tests (radio semantics; tapping "Heavy" calls onChange("heavy"); gentle card buttons; heavy nudge shows after 7 heavy days and records the time) → implement → PASS → commit `feat(mobile): mood picker and safety components`.

### Task 3: Today screen

**Files:** `src/components/today/*`, `src/app/(tabs)/index.tsx`, `__tests__/today.test.tsx`.

**Behaviour (web §4.1):** date + greeting by part of day; reflection prompt (Newsreader ~28) with "Another prompt" and "Write about this" → `router.push({ pathname: "/vent", params: { prompt: offset } })`; quick check-in: one tap saves (`addMood`), "Saved for today"; "Add tags or a note" expands tags (`DEFAULT_TAGS`) + note; **locked vault → inline passcode field** (Review Focus 2); changing the mood keeps tags/note (`changeMood`); heavy nudge; entry links (Vent, Breathe → `/sanctuary`, Tonight's music → `/sanctuary`).

- [ ] Steps: failing tests ported from `tests/unit/today.test.tsx` (one tap saves; note encrypted and readable; note kept when mood changes; locked vault asks for passcode and saves) → implement → PASS → commit `feat(mobile): Today screen`.

### Task 4: Vent — release into the void, save to vault

**Files:** `src/components/vent/*`, `src/app/(tabs)/vent.tsx`, `src/hooks/use-app-state.ts`, `__tests__/vent.test.tsx`.

**Behaviour (web §4.2):** full-screen: the vent route hides the tab bar and header while writing (`navigation.setOptions({ tabBarStyle: { display: "none" } })` on focus); serif multiline `TextInput` (`autoCorrect={false}`, `spellCheck={false}`, `autoComplete="off"`, `keyboardAppearance` per theme); prompt hint from `params.prompt`; buttons **Release into the void** (ember) / **Save to vault**; core `checkText` → `GentleCard` (once per session); dissolve: words (≤ 120 tokens animated, the rest fade) drift up with blur-less opacity/translate/rotate via Reanimated, ember particles, ~2.4 s; Reduce Motion → 600 ms fade; `Haptics.notificationAsync(Success)` when it finishes; after-release screen ("Let go.", links: listen to the rain → `/sanctuary`, write again, back to Today) — **no ads**; release clears state and remounts the input (`key`). **AppState background while writing → blur the screen content** (privacy in the app switcher). Save sheet: optional title, inline passcode if locked, toast "Saved to your vault".

- [ ] Step 1: failing tests: type + release → after the dissolve (fake timers) "Let go." shows, input empty, `getStorage().journal.list()` empty and an in-memory KV dump has no released text (Review Focus 1); release disabled when empty; risk phrase → gentle card → "Continue releasing" → released; second time no card; save → encrypted entry, toast, input cleared.
- [ ] Step 2–4: `npx expo install expo-haptics`; implement; PASS; on the simulator check animation smoothness and Reduce Motion (Settings → Accessibility).
- [ ] Step 5: Commit `feat(mobile): Vent with dissolve, gentle card and save to vault`.

### Task 5: Vault

**Files:** `src/components/vault/*`, `src/app/(tabs)/vault.tsx`, `src/lib/auto-lock.ts`, `src/hooks/use-vault.ts` (status `"unavailable"` + `retry()`), `__tests__/vault.test.tsx`, `test/auto-lock.test.ts` (Vitest).

**Behaviour (web §4.3):** list (title or first line, date) → reader (edit, delete with confirm); settings sheet: set/change/remove passcode (twice), auto-lock 1/5/15/30 min, lock now, regenerate recovery code; `RecoveryCodeCard` (12 words numbered, copy via `expo-clipboard`, "I've saved it" required before Done, warning copy); unlock panel; forgot flow = recovery code → new passcode (core `checkRecoveryCode` / `resetPasscodeWithRecoveryCode`), or 1-hour reset; **unavailable state** (Review Focus 3): if `initVault` throws (secure-store error) show `t.vault.unavailable` + "Try again" — never the reset flow; **auto-lock** (Review Focus 4): `startMobileAutoLock()` records the time the app goes to background and locks on return when `isIdleTooLong`; also locks after inactivity while in foreground (touch handler on the root view).

- [ ] Step 1: failing tests ported from `tests/unit/vault-ui.test.tsx` (list; recovery card ack; lock/unlock; recovery-code reset sets a new passcode; 1-hour reset) + new: unavailable state shows retry and no forgot link; auto-lock unit test with fake AppState.
- [ ] Step 2–4: `npx expo install expo-clipboard`; add dictionary keys (`vault.unavailable`, `vault.retry`); implement; PASS.
- [ ] Step 5: Commit `feat(mobile): Vault with passcode, recovery, reset and auto-lock`.

### Task 6: Mood journey

**Files:** `src/components/mood/{CheckinForm,WeekStrip,MonthHeatmap,MoodHistory}.tsx`, `src/app/(tabs)/mood.tsx`, `__tests__/mood.test.tsx`.

**Behaviour (web §4.4):** full check-in (mood, default + custom tags (prefs, max 12), note with inline passcode when locked); week strip (7 dots, empty = dashed ring, labels via accessibilityLabel); month heatmap (Monday-first grid, 2 pt gaps, 4 pt radius, today marker, prev/next month — next disabled at current month, cell press → day detail with tags + decrypted notes); legend (5 moods); history (latest 30, delete with confirm). No counts or percentages.

- [ ] Steps: failing tests ported from `tests/unit/mood-ui.test.tsx` → implement → PASS → commit `feat(mobile): Mood journey`.

### Task 7: Help, Settings completion, first-run notice

**Files:** `src/app/help.tsx`, `src/app/settings.tsx`, `src/lib/export.ts`, `src/components/FirstRunNotice.tsx`, `__tests__/settings.test.tsx`, `__tests__/help.test.tsx`.

**Behaviour:** Help (web §8): core `HOTLINES`, home country first for `vi`, open-now first (`isOpenNow`), hours, **Call** → `Linking.openURL(telHref(phone))`, findahelpline link, disclaimer; works offline (no network needed). Settings adds: vault link, data export (`buildExport()` JSON → `expo-file-system` cache file → `expo-sharing` share sheet; journal stays encrypted), erase everything (type-to-confirm word; wipes vault + Keychain key + moods + prefs, then `router.replace("/")` — Review Focus 5), about/disclaimer, help link. First-run notice: once (`prefs.firstRunSeen`), never over `/help`.

- [ ] Steps: failing tests (help ordering + tel link; export payload encrypted; erase requires the word then storage, secure store and prefs are empty; first-run shows once) → `npx expo install expo-sharing expo-file-system` → implement → PASS → commit `feat(mobile): Help, data export, erase and first-run notice`.

### Task 8: Owner run-through

**Files:** `docs/mobile/M3-report.md`.

- [ ] Write the report: features, test counts, a step-by-step simulator checklist for the owner (vent → release → "Let go."; save → vault; set passcode → recovery card → lock/unlock; check-in with note; month map; help call link; erase everything), known gaps (audio M4, accounts M5, ads M6, Android not run).
- [ ] Commit `docs(mobile): M3 report`.
