# MindCocoon v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Tóm tắt (VI):** Kế hoạch 19 task, chia 3 phần. **Phần A (T1–T14)**: app chạy hoàn toàn trên máy — song ngữ, két mã hóa DEK/KEK + mã khôi phục + lấy lại sau 1 giờ, Trút bỏ + hiệu ứng tan chữ, bản đồ cảm xúc, Sanctuary (thở, âm thanh, nhạc của đêm nay, hẹn giờ tắt), an toàn, cài đặt, PWA offline, khung quảng cáo tắt. **Phần B (T15–T18)**: Supabase, đăng nhập 16+, sao lưu mã hóa đầu-cuối, thống kê ẩn danh. **Phần C (T19)**: kiểm thử E2E, build sạch, tài liệu deploy. Mỗi phần tự chạy được độc lập.

**Goal:** Ship MindCocoon v1 — a bilingual (vi/en), local-first, installable web app for late-night emotional decompression, with optional 16+ login and end-to-end-encrypted cloud backup.

**Architecture:** Next.js 16 App Router with a `[lang]` root segment (`proxy.ts` picks the locale). Almost all product UI is client components over module-level external stores (`useSyncExternalStore`), persisted in IndexedDB through `lib/storage`. All private content is encrypted on-device with a random data key (DEK) wrapped by several key-encryption keys (device / passcode / recovery code / server secret). Supabase is used client-side only for auth, encrypted backup blobs, and anonymous open counts.

**Tech Stack:** Next.js 16.4 (cacheComponents on), React 19.3, TypeScript, Tailwind v4, shadcn/ui (Radix base), lucide-react, framer-motion, idb-keyval, @supabase/supabase-js, @scure/bip39, Vitest + jsdom + Testing Library + fake-indexeddb, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-16-mindcocoon-design.md` (Vietnamese). Read it before any task.

## Global Constraints

- Before writing Next.js code, read the matching guide in `node_modules/next/dist/docs/` (this is Next 16; APIs differ from older versions). `cacheComponents: true` stays on: pages hidden by navigation are kept alive with `<Activity>`, effects clean up on hide and re-run on show.
- Every user-visible string goes through the dictionaries (`lib/i18n/dictionaries/{vi,en}.ts`); both locales must have identical keys. Sentence case, no ALL-CAPS labels, no exclamation-heavy copy.
- No streaks, badges, counters, percentages or scores anywhere in the UI (spec §2 anti-goals, §4.4).
- Text released "into the void" is never written to any storage, log, analytics event or network request.
- Private content (journal title/body, mood notes) is only ever stored or sent as `v1.<iv>.<ciphertext>` envelopes. Mood colour + tags are plaintext locally, encrypted in backups.
- Analytics events carry only: random device id, hour bucket, locale. Never content, moods or tags.
- Ads never render on: `/vent`, `/vault`, `/sanctuary` breathing view, the after-release screen, `/help`. Ads are off by default (`NEXT_PUBLIC_ADS_ENABLED` unset).
- Respect `prefers-reduced-motion` in every animation (framer-motion `useReducedMotion`).
- Palette/typography from spec §7: bg `#0F172A`, text `#F1F5F9`, sage-teal `#7FB5A8`, ember `#D9A86C`; Newsreader (serif) + Hanken Grotesk, both loaded with the `vietnamese` subset.
- Login is offered only after confirming age ≥ 16. Nothing in v1 requires login.
- Locales: `vi`, `en`. Default when nothing matches: `en`. Vietnamese browsers (`vi*`) get `vi`.
- Commit after every task with a Conventional Commit message ending in `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Locked vault + mood note:** user with a passcode-locked vault types a note in the Today quick check-in → app must ask to unlock (or save the mood without the note), never store the note in plaintext. → test in Task 5.
2. **Restore onto a device that already has data:** signing in on a device with local entries while a remote backup exists → user must choose which copy wins; nothing is silently overwritten. → test in Task 17.
3. **Unaccented / mixed Vietnamese in the vent:** "khong muon song nua", "muốn chết đi cho rồi" must trigger the gentle card; "cười muốn chết", "mệt muốn chết", "giết thời gian" must not. → test in Task 8.
4. **Navigation away mid-vent:** with `<Activity>` the vent draft survives navigation; after "Release" the draft, undo history and any React state are gone even if the user navigates back. → test in Task 7.
5. **Clock edge cases:** quiet hours `23-5` spans midnight (23:00 and 04:59 quiet, 05:00 and 22:59 not); a day's mood = latest log in local time; 1-hour reset not completable at 59:59. → tests in Tasks 5, 9, 14.

---

## File Map

```
proxy.ts                                 locale redirect
app/[lang]/layout.tsx                    root layout (html lang, fonts, providers, shell)
app/[lang]/page.tsx                      Today
app/[lang]/{vent,vault,mood,sanctuary,settings,help,auth/callback}/page.tsx
app/manifest.ts, app/icon.svg, public/sw.js
lib/i18n/{config.ts,get-dictionary.ts,dictionaries/en.ts,dictionaries/vi.ts}
lib/storage/{driver.ts,repositories.ts,local.ts,index.ts}   (exists; Task 3 changes VaultKeyRepository)
lib/crypto.ts                            (exists; Task 3 extends)
lib/vault/{keyring.ts,session.ts}        (replaces lib/vault.ts)
lib/mood/{store.ts,selectors.ts}         (replaces lib/mood-store.ts)
lib/safety/{detect.ts,hotlines.ts,phrases.ts}
lib/audio/{engine.ts,tonight.ts}         (replaces lib/audio-engine.ts)
lib/breathing.ts, lib/prompts.ts, lib/moods.ts, lib/sounds.ts, lib/dates.ts
lib/ads/config.ts, lib/analytics.ts, lib/pwa.ts
lib/supabase/client.ts, lib/auth/store.ts
lib/backup/{snapshot.ts,remote.ts,supabase-remote.ts,engine.ts}
components/providers/{theme-provider.tsx,i18n-provider.tsx,app-providers.tsx}
components/shell/{app-shell.tsx,nav-items.ts,mini-audio-bar.tsx,page-transition.tsx}
components/modules/<feature>/*.tsx
supabase/migrations/0001_init.sql
tests/unit/**  tests/e2e/**  vitest.config.mts  playwright.config.ts
CLAUDE.md  README.md  .env.example  docs/LAUNCH_CHECKLIST.md
```

Existing pre-brainstorm code (`lib/vault.ts`, `lib/mood-store.ts`, `lib/audio-engine.ts`, `lib/entitlements.ts`, `components/shell/nav-items.ts`, hooks) is reused where the tasks say so and deleted where replaced.

---

## Part A — Local-first app

### Task 1: Test tooling, scripts, CLAUDE.md

**Files:**
- Create: `vitest.config.mts`, `tests/setup.ts`, `playwright.config.ts`, `tests/unit/smoke.test.ts`, `CLAUDE.md`, `.env.example`
- Modify: `package.json` (scripts), `.gitignore` (`/test-results`, `/playwright-report`)

**Interfaces:**
- Produces: `npm test` (vitest run), `npm run test:watch`, `npm run test:e2e` (playwright), `npm run typecheck` (`tsc --noEmit`), `npm run lint`, `npm run gen:audio`.

- [ ] **Step 1:** Install dev deps: `npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom vite-tsconfig-paths fake-indexeddb @playwright/test`.
- [ ] **Step 2:** `vitest.config.mts` per `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`, `environment: 'jsdom'`, `setupFiles: ['tests/setup.ts']`, `include: ['tests/unit/**/*.test.{ts,tsx}']`. `tests/setup.ts` imports `fake-indexeddb/auto` and `@testing-library/jest-dom/vitest`. Crypto tests use the `// @vitest-environment node` pragma (Node's WebCrypto).
- [ ] **Step 3:** Write `tests/unit/smoke.test.ts`: `expect(typeof indexedDB.open).toBe('function')` and (node env file) `expect(crypto.subtle).toBeDefined()`.
- [ ] **Step 4:** Run `npm test` → PASS.
- [ ] **Step 5:** `playwright.config.ts`: `webServer: { command: 'npm run build && npm run start', port: 3000, reuseExistingServer: true }`, projects: chromium desktop + `devices['iPhone 14']` (webkit). Run `npx playwright install chromium webkit`.
- [ ] **Step 6:** Write `CLAUDE.md`: first line `@AGENTS.md`; then sections Commands (all scripts above), Architecture (copy the Architecture paragraph + File Map), Rules (copy Global Constraints), Spec/plan paths. Write `.env.example` listing every env var used in this plan with a comment each (filled in by later tasks; start with `NEXT_PUBLIC_ADS_ENABLED=`, `NEXT_PUBLIC_QUIET_HOURS=23-5`).
- [ ] **Step 7:** `npm run typecheck && npm run lint && npm test` → all clean. Commit `chore: add test tooling and CLAUDE.md`.

### Task 2: Locale routing and dictionaries

**Files:**
- Create: `lib/i18n/config.ts`, `lib/i18n/get-dictionary.ts`, `lib/i18n/dictionaries/en.ts`, `lib/i18n/dictionaries/vi.ts`, `components/providers/i18n-provider.tsx`, `proxy.ts`, `app/[lang]/layout.tsx`, `app/[lang]/page.tsx` (temporary placeholder), `app/[lang]/not-found.tsx`
- Delete: `app/layout.tsx`, `app/page.tsx`
- Test: `tests/unit/i18n.test.ts`

**Interfaces:**
- Produces:
  - `LOCALES = ['vi','en'] as const`, `type Locale`, `DEFAULT_LOCALE: Locale = 'en'`, `LOCALE_COOKIE = 'mc-locale'`, `isLocale(v: unknown): v is Locale`, `resolveLocale(input: { cookie?: string; acceptLanguage?: string | null }): Locale`
  - `type Dictionary = typeof en` (en is the source of truth, `as const` not used — strings typed as `string`), `getDictionary(locale: Locale): Dictionary`
  - `<I18nProvider locale dictionary>`, `useI18n(): { locale: Locale; t: Dictionary; href(path: string): string; setLocale(l: Locale): void }` — `href('/vent')` → `/vi/vent`; `setLocale` writes the cookie (1 year) and `router.replace`s the same path in the new locale.
  - `app/[lang]/layout.tsx` exports `generateStaticParams()` → both locales; validates `lang` with `isLocale` else `notFound()`.

- [ ] **Step 1: Failing tests** in `tests/unit/i18n.test.ts`:
```ts
expect(resolveLocale({ acceptLanguage: 'vi-VN,vi;q=0.9,en;q=0.8' })).toBe('vi')
expect(resolveLocale({ acceptLanguage: 'fr-FR,en;q=0.5' })).toBe('en')
expect(resolveLocale({ acceptLanguage: 'fr-FR' })).toBe('en')
expect(resolveLocale({ cookie: 'vi', acceptLanguage: 'en-US' })).toBe('vi')
expect(resolveLocale({ cookie: 'xx', acceptLanguage: 'vi' })).toBe('vi')
// key parity: every leaf path in en exists in vi and vice versa, all non-empty strings
expect(leafPaths(vi)).toEqual(leafPaths(en))
```
- [ ] **Step 2:** Run → FAIL (module missing).
- [ ] **Step 3:** Implement config + dictionaries (start with `meta`, `nav` (today, vent, mood, sanctuary, vault, settings), `common` keys; later tasks add keys to both files) + provider. `resolveLocale` parses q-weighted Accept-Language without extra deps.
- [ ] **Step 4:** `proxy.ts` (read `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` first): if the path has no locale prefix and is not `_next`, `api`, a file with an extension, `sw.js`, or `manifest.webmanifest` → redirect to `/${resolveLocale(...)}${path}`.
- [ ] **Step 5:** `app/[lang]/layout.tsx`: `<html lang={lang} className="dark">`, fonts `Newsreader` + `Hanken_Grotesk` from `next/font/google` with `subsets: ['latin','vietnamese']`, variables `--font-newsreader` / `--font-hanken` (already referenced by `app/globals.css`), `ThemeProvider` (existing), `I18nProvider`, `Toaster`. Metadata title/description from the dictionary via `generateMetadata`.
- [ ] **Step 6:** Run tests → PASS; `npm run build` → PASS with `/vi` and `/en` prerendered.
- [ ] **Step 7:** Commit `feat(i18n): locale routing and vi/en dictionaries`.

### Task 3: Vault keyring (DEK/KEK)

**Files:**
- Create: `lib/vault/keyring.ts`
- Modify: `lib/crypto.ts` (add helpers), `lib/storage/repositories.ts` + `lib/storage/local.ts` (VaultKeyRepository), `types/index.ts` (remove `VaultMeta`, add `Keyring` types)
- Test: `tests/unit/keyring.test.ts` (`// @vitest-environment node`)

**Interfaces:**
- Produces (`lib/crypto.ts`): `importDek(raw: Uint8Array): Promise<CryptoKey>` (non-extractable AES-GCM), `encryptBytes(key, bytes): Promise<string>`, `decryptBytes(key, envelope): Promise<Uint8Array>`, `deriveKeyFromSecret(secret: string, salt: string, iterations: number): Promise<CryptoKey>` (rename of `deriveKeyFromPasscode`), `generateRecoveryCode(): string` (12 BIP39 English words via `@scure/bip39` `generateMnemonic(wordlist, 128)`), `normalizeRecoveryCode(input: string): string` (lowercase, trim, collapse whitespace/dashes to single spaces), `isValidRecoveryCode(input): boolean`. Keep `encryptString`/`decryptString`.
- Produces (`types/index.ts`):
```ts
export interface KdfWrap { salt: string; iterations: number; wrapped: string }
export interface Keyring {
  version: 1
  device?: string        // DEK wrapped by device key — present only when no passcode
  passcode?: KdfWrap
  recovery?: KdfWrap
  server?: string        // DEK wrapped by server secret — LOCAL ONLY, never uploaded
  deviceReset?: string   // DEK wrapped by device key, present when passcode set (1h reset path)
  resetRequestedAt?: number
  autoLockMinutes: number
}
export interface UnlockedDek { key: CryptoKey; raw: Uint8Array }
```
- Produces (`lib/vault/keyring.ts`): `DEVICE_RESET_WAIT_MS = 3_600_000`, `createKeyring(deviceKey: CryptoKey): Promise<{ keyring: Keyring; dek: UnlockedDek }>`, `unlockWithDevice(k, deviceKey)`, `unlockWithPasscode(k, passcode)`, `unlockWithRecoveryCode(k, code)`, `unlockWithServerSecret(k, secret)` — each `Promise<UnlockedDek | null>` (null on wrong secret / missing wrap); `setPasscode(k, dek, passcode, deviceKey): Promise<Keyring>` (adds `passcode` + `deviceReset`, removes `device`); `removePasscode(k, dek, deviceKey): Promise<Keyring>` (inverse); `setRecoveryCode(k, dek): Promise<{ keyring: Keyring; code: string }>`; `setServerWrap(k, dek, secret): Promise<Keyring>`; `requestDeviceReset(k, now: number): Keyring`; `resetReadyAt(k): number | null`; `completeDeviceReset(k, deviceKey, now): Promise<UnlockedDek | null>` (null if not requested or `now - resetRequestedAt < DEVICE_RESET_WAIT_MS`); `backupWraps(k): Pick<Keyring, 'passcode' | 'recovery'>`; `adoptBackupWraps(wraps: Pick<Keyring,'passcode'|'recovery'>, dek: UnlockedDek, deviceKey: CryptoKey): Promise<Keyring>` (used on restore: keeps the given wraps and adds `device` when there is no passcode, `deviceReset` when there is).
- Produces (`VaultKeyRepository`): `getKeyring(): Promise<Keyring | undefined>`, `setKeyring(k): Promise<void>`, `getDeviceKey`, `setDeviceKey`, `clear()`.

- [ ] **Step 1: Failing tests:**
```ts
const deviceKey = await generateDeviceKey()
const { keyring, dek } = await createKeyring(deviceKey)
expect(keyring.device).toMatch(/^v1\./)
expect((await unlockWithDevice(keyring, deviceKey))!.raw).toEqual(dek.raw)

const locked = await setPasscode(keyring, dek, '2468', deviceKey)
expect(locked.device).toBeUndefined()
expect(await unlockWithPasscode(locked, '1357')).toBeNull()
expect((await unlockWithPasscode(locked, '2468'))!.raw).toEqual(dek.raw)

const { keyring: withCode, code } = await setRecoveryCode(locked, dek)
expect(code.split(' ')).toHaveLength(12)
expect((await unlockWithRecoveryCode(withCode, '  ' + code.toUpperCase().replace(/ /g, '-') + ' '))!.raw).toEqual(dek.raw)

const requested = requestDeviceReset(withCode, 1_000)
expect(await completeDeviceReset(requested, deviceKey, 1_000 + 3_599_999)).toBeNull()
expect((await completeDeviceReset(requested, deviceKey, 1_000 + 3_600_000))!.raw).toEqual(dek.raw)

const withServer = await setServerWrap(withCode, dek, 'server-secret')
expect(backupWraps(withServer)).not.toHaveProperty('server')
expect(backupWraps(withServer)).not.toHaveProperty('deviceReset')
const adopted = await adoptBackupWraps(backupWraps(withServer), dek, await generateDeviceKey())
expect(adopted.deviceReset).toMatch(/^v1\./)   // passcode present → reset path, no auto-unlock
expect(adopted.device).toBeUndefined()
// changing passcode must not change the DEK (entries need no re-encryption)
const changed = await setPasscode(withServer, dek, '9999', deviceKey)
expect((await unlockWithPasscode(changed, '9999'))!.raw).toEqual(dek.raw)
```
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement. DEK = 32 random bytes; wraps = `encryptBytes(kek, raw)`; KDF wraps use PBKDF2-SHA256 `PBKDF2_ITERATIONS` (310 000) with a fresh 16-byte salt per wrap; tests may pass a lower iteration count through an exported `__setIterationsForTests(n)` to stay fast.
- [ ] **Step 4:** Run → PASS. `npm run typecheck`.
- [ ] **Step 5:** Commit `feat(vault): DEK/KEK keyring with passcode, recovery code and device reset`.

### Task 4: Vault session store

**Files:**
- Create: `lib/vault/session.ts`, `hooks/use-vault.ts` (rewrite)
- Delete: `lib/vault.ts`
- Test: `tests/unit/vault-session.test.ts` (node env + `fake-indexeddb/auto`)

**Interfaces:**
- Consumes: Task 3 keyring API, `getStorage()`.
- Produces:
```ts
type VaultStatus = 'idle' | 'loading' | 'locked' | 'unlocked' | 'unsupported'
interface VaultState { status: VaultStatus; hasPasscode: boolean; hasRecoveryCode: boolean;
  resetReadyAt: number | null; autoLockMinutes: number; entries: DecryptedJournalEntry[] }
subscribeVault, getVaultState, getVaultServerState
initVault(): Promise<void>                        // device mode auto-unlocks
unlockWithPasscode(p: string): Promise<boolean>
unlockWithRecoveryCode(code: string): Promise<boolean>
unlockWithServerSecret(secret: string): Promise<boolean>
lockVault(): void                                  // no-op without passcode
saveVaultEntry(i: { title?: string; body: string }): Promise<DecryptedJournalEntry>
updateVaultEntry(id: string, i: { title?: string; body: string }): Promise<void>
deleteVaultEntry(id: string): Promise<void>
setVaultPasscode(p: string): Promise<{ recoveryCode: string | null }>  // creates a code if none yet
removeVaultPasscode(): Promise<void>
regenerateRecoveryCode(): Promise<string>
requestPasscodeReset(): Promise<void>
completePasscodeReset(newPasscode: string): Promise<boolean>
attachServerSecret(secret: string): Promise<void>  // used by Task 17
setVaultAutoLock(minutes: number): Promise<void>
encryptField(text: string): Promise<string>        // throws VaultLockedError when locked
decryptField(envelope: string): Promise<string>
getUnlockedDek(): UnlockedDek | null               // used by backup (Task 17)
onVaultChange(listener: () => void): () => void    // fires after any persisted change (Task 17)
reloadVault(): Promise<void>                       // re-reads keyring + entries from storage (after restore)
wipeVault(): Promise<void>
startVaultAutoLock(): void
class VaultLockedError extends Error {}
```
- [ ] **Step 1: Failing tests:** fresh vault → `status 'unlocked'`, `hasPasscode false`; save entry → stored `JournalEntry.content` matches `/^v1\./`, `title` undefined, body not present in `JSON.stringify(await getStorage().journal.list())`; `setVaultPasscode('2468')` returns 12-word code; after `lockVault()` → `entries` empty and `encryptField('x')` rejects with `VaultLockedError`; `unlockWithPasscode('0000')` false, `'2468'` true with the entry decrypted; `requestPasscodeReset()` then `completePasscodeReset('1111')` with mocked `Date.now` +59m59s → false, +60m → true, then `unlockWithPasscode('1111')` true after lock; `onVaultChange` listener called once per save.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement (port auto-lock logic from the deleted `lib/vault.ts`). **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(vault): session store on top of keyring`.

### Task 5: Mood store, encrypted notes, selectors

**Files:**
- Create: `lib/mood/store.ts` (from `lib/mood-store.ts`), `lib/mood/selectors.ts`, `hooks/use-mood-logs.ts` (update import)
- Modify: `types/index.ts` (`MoodLog.isNoteEncrypted?: boolean`), `lib/moods.ts` (labels move to dictionaries: keep ids + colour vars; `DEFAULT_TAGS = ['work','relationship','solitude','family','health','study']` as keys translated via `t.mood.tags.*`)
- Delete: `lib/mood-store.ts`
- Test: `tests/unit/mood.test.ts`

**Interfaces:**
- Produces: `addMood(i: { mood: MoodType; tags: string[]; note?: string }): Promise<MoodLog>` (encrypts note via `encryptField`; rejects with `VaultLockedError` when a note is given and the vault is locked), `removeMood`, `clearMoods`, `loadMoods`, `readNote(log: MoodLog): Promise<string | null>` (null when locked).
- Selectors (pure, `now: Date` injected): `latestMoodByDay(logs): Map<string /*dayKey*/, MoodLog>`, `weekStrip(logs, now): { dayKey: string; date: Date; log: MoodLog | null }[]` (7 items, oldest first, ends today), `monthGrid(logs, year: number, month: number): ({ dayKey: string; date: Date; log: MoodLog | null } | null)[]` (Monday-first, leading `null`s), `shouldShowHeavyNudge(logs, now: Date, lastShownAt: number | null): boolean` (true when the latest log of each of the last 7 local days incl. today is `heavy`, and `lastShownAt` is null or ≥ 7 days ago).

- [ ] **Step 1: Failing tests:** two logs same day 09:00 `heavy` and 21:00 `hopeful` → `latestMoodByDay` gives `hopeful`; a log at 23:30 local belongs to that day not the next; `weekStrip` length 7, last item today, empty days `log: null`; `monthGrid(…, 2026, 9)` (October 2026 starts Thursday) → 3 leading nulls, 31 day cells; heavy nudge: 7 heavy days → true, 6 → false, 7 with a `peaceful` later on day 4 → false, `lastShownAt` 3 days ago → false; **Review Focus 1:** with vault locked (passcode set + `lockVault()`), `addMood({ mood:'heavy', tags:[], note:'x' })` rejects with `VaultLockedError` and storage has no new log; without a note it succeeds.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** Commit `feat(mood): encrypted notes and timeline selectors`.

### Task 6: App shell and Today

**Files:**
- Create: `components/shell/app-shell.tsx`, `components/shell/page-transition.tsx`, `components/shell/mini-audio-bar.tsx` (UI only; wired in Task 11), `components/modules/today/{today-view.tsx,quick-checkin.tsx,reflection-prompt.tsx}`, `components/modules/mood/mood-picker.tsx` (shared), `app/[lang]/page.tsx`
- Modify: `components/shell/nav-items.ts` (labels from `t.nav`), `lib/prompts.ts` (`REFLECTION_PROMPTS: Record<Locale, string[]>`, equal lengths, add ≥5 school/exam/parents/friends prompts to both; `promptForDay(date, locale, offset = 0)`)
- Test: `tests/unit/today.test.tsx`, `tests/unit/prompts.test.ts`

**Interfaces:**
- Produces: `<AppShell>` (desktop left rail `md:` ≥768px, mobile bottom tab bar with Today/Vent/Mood/Sanctuary/Vault + settings icon in a mobile header; hides itself when `usePathname()` ends with `/vent`), `<PageTransition>` (framer-motion fade/2px rise re-run in `useLayoutEffect` so it replays when `<Activity>` reveals the page), `<MoodPicker value onChange size>` (5 colour dots with labels, radio-group semantics, arrow-key navigation).
- Today content (spec §4.1): greeting by `partOfDay`, prompt in Newsreader ~2rem with "another prompt" + "Write about this" (→ `href('/vent?prompt=<offset>')`), quick check-in = `MoodPicker` (one tap saves) + expandable tags/note, entry tiles to Vent / Breathe / Tonight's music, heavy nudge line (Task 8 provides the copy), `<AdBanner placement="today" />` slot at the bottom (Task 14 provides it; leave a TODO-free placeholder `null` component until then).
- Date-dependent UI renders only after `useNow()` (existing hook) returns non-null.

- [ ] **Step 1: Failing tests:** prompts: `REFLECTION_PROMPTS.vi.length === REFLECTION_PROMPTS.en.length`; `promptForDay(d,'en')` stable for the same day, offset 1 differs. Today: render with providers, click the "Heavy" dot → `getStorage().moods.list()` has one `heavy` log and a confirmation line appears ("Saved for today" / "Đã lưu cho hôm nay").
- [ ] **Step 2–4:** FAIL → implement → PASS. Manually check at 375px and 1280px with `npm run dev`.
- [ ] **Step 5:** Commit `feat(today): app shell and Today screen`.

### Task 7: Safe Vent

**Files:**
- Create: `app/[lang]/vent/page.tsx`, `components/modules/vent/{vent-view.tsx,dissolve-overlay.tsx,after-release.tsx,save-dialog.tsx}`
- Test: `tests/unit/vent.test.tsx`

**Interfaces:**
- Consumes: `saveVaultEntry`, `useVault`, `promptForDay`. (The safety check is wired into this view by Task 8.)
- Produces: `<DissolveOverlay text onDone>` — splits text into word spans (characters if ≤ 600 chars), each animates `y: -(40..140)px`, `x: ±30px`, `opacity → 0`, `filter: blur(6px)`, colour fades to `var(--ember)`, staggered bottom-up over ~2.2s; random offsets generated in the click handler (not during render). Reduced motion → single 600ms opacity fade.

Behaviour (spec §4.2): fixed full-screen surface (`fixed inset-0 z-40`), autosizing serif textarea, prompt shown faintly when `?prompt=` present (wrap the reader in `<Suspense>`), top bar with back link, vault link and "Need to talk to someone now?" link to `/help`. Actions: **Release into the void** (disabled when empty) and **Save to vault**. On release: run safety check → overlay → clear state and remount the textarea with a new `key` (drops undo history) → `<AfterRelease>` ("Let go." / "Đã buông.") with links to Sanctuary sound + Today; no ads. Save dialog: optional title, unlock prompt if vault locked, success toast "Saved to your vault" / "Đã cất vào két".

- [ ] **Step 1: Failing tests:** type "secret words" → click Release → after overlay `onDone` (mock framer-motion's `animate` via `vi.mock('framer-motion', …)` or `MotionGlobalConfig.skipAnimations = true`) → textarea value is `''`, `getStorage().journal.list()` is empty, `indexedDB` dump (iterate all keys of the kv store) contains no `"secret words"`; **Review Focus 4:** rerender the view (simulating Activity hide/show by toggling a parent `hidden`) after release → still empty. Save path: type text, Save, title "t" → one journal entry, body decrypts to the text.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** Commit `feat(vent): release into the void and save to vault`.

### Task 8: Safety — detection, gentle card, help page, heavy nudge

**Files:**
- Create: `lib/safety/phrases.ts`, `lib/safety/detect.ts`, `lib/safety/hotlines.ts`, `components/modules/safety/{gentle-card.tsx,help-link.tsx}`, `app/[lang]/help/page.tsx`
- Modify: Today view (heavy nudge line; store `lastShownAt` in localStorage key `mc:heavy-nudge`), dictionaries (`safety.*`)
- Test: `tests/unit/safety.test.ts`

**Interfaces:**
- Produces: `normalizeForMatch(text: string): string` (NFD, strip combining marks, `đ→d`, lowercase, collapse whitespace), `checkText(text: string): { flagged: boolean }` (remove EXCLUSIONS from the normalized text first, then match RISK phrases on word boundaries), `RISK_PHRASES: { vi: string[]; en: string[] }`, `EXCLUSIONS: string[]`, `type Hotline = { id; country: string /*ISO*/; name: Record<Locale,string>; phone: string; hours: '24/7' | { tz: string; open: string; close: string }; audience: 'all' | 'youth'; verified: boolean }`, `HOTLINES: Hotline[]`, `isOpenNow(h: Hotline, now: Date): boolean`, `<GentleCard onContinue onClose>`, `<HelpLink />`.
- Gentle card copy (spec §8, exact): vi "Những gì bạn vừa viết nghe rất nặng. Bạn không phải một mình." / en "What you just wrote sounds really heavy. You're not alone." Buttons: "Gọi đường dây hỗ trợ"/"Call a support line" (→ `/help`), "Tiếp tục thả"/"Continue releasing". Shown at most once per page session (module-level flag).
- Hotline seed data: VN `115` (emergency, 24/7, verified:false), VN `111` (youth, 24/7, verified:false), US `988`, UK Samaritans `116 123`, AU Lifeline `13 11 14`, SG SOS `1767`; all `verified: false`. Help page lists the user's locale country first (vi → VN), open-now lines first, shows hours, `tel:` links, findahelpline.com link, a visible note while any entry is `verified: false` **only in development** (`process.env.NODE_ENV !== 'production'`). Launch checklist (Task 19) requires verifying every number.

- [ ] **Step 1: Failing tests (Review Focus 3):** flagged: `"tôi không muốn sống nữa"`, `"khong muon song nua"`, `"muốn chết đi cho rồi"`, `"I want to kill myself"`, `"i dont want to live anymore"`, `"tự tử"`; not flagged (accent-stripping must not create false hits): `"từ từ thôi"` (normalizes to "tu tu", same as unaccented "tự tử" — so the unaccented form is matched only as `"muon tu tu"` / `"tinh tu tu"`), `"cười muốn chết"`, `"mệt muốn chết"`, `"giết thời gian"`, `"this traffic is killing me"`, `"chết rồi, quên mang ví"`. `isOpenNow` with a `{tz:'Asia/Ho_Chi_Minh', open:'08:00', close:'22:00'}` line at 21:59 and 22:00 ICT → true/false.
- [ ] **Step 2–4:** FAIL → implement → PASS. Wire `checkText` into Vent release and save (card appears before the overlay; "Continue releasing" proceeds).
- [ ] **Step 5:** Commit `feat(safety): on-device risk check, help page and gentle nudges`.

### Task 9: Vault screen

**Files:**
- Create: `app/[lang]/vault/page.tsx`, `components/modules/vault/{vault-view.tsx,entry-list.tsx,entry-reader.tsx,unlock-panel.tsx,passcode-setup.tsx,recovery-code-card.tsx,forgot-passcode.tsx,vault-settings.tsx}`
- Test: `tests/unit/vault-ui.test.tsx`

**Interfaces:**
- Consumes: Task 4 session API.
- Produces: screens for: locked (passcode input, "Forgot passcode?"), unlocked list (newest first, title or first line, date), reader/editor (edit, delete with confirm), settings sheet (set/change/remove passcode, auto-lock 1/5/15/30 min, "Lock now", regenerate recovery code). `RecoveryCodeCard` shows the 12 words in a numbered grid (it *is* a sequence), copy button, "I've saved it" checkbox required before closing, warning copy: "If you lose this code and forget your passcode, your journal can't be recovered." (vi equivalent). Forgot flow offers: recovery code input → set new passcode; "Reset on this device" → `requestPasscodeReset()` → shows ready time (`resetReadyAt`) → after it passes, "Set a new passcode"; "Sign in to reset" button rendered only when Task 16's `useAuth().user` exists (render nothing before Task 16).
- Passcode: 4–12 digits or characters, entered twice.

- [ ] **Step 1: Failing tests:** set passcode `2468` twice → recovery card shows 12 words and Close is disabled until the checkbox is ticked; Lock now → list hidden, unlock with `0000` shows "That passcode didn't match." and `2468` shows entries; forgot → reset on this device at t → "ready at" text shown and "Set a new passcode" disabled at t+59m59s, enabled at t+60m (fake timers + `useNow` mock).
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** Commit `feat(vault): vault screen with passcode, recovery code and reset`.

### Task 10: Mood journey screen

**Files:**
- Create: `app/[lang]/mood/page.tsx`, `components/modules/mood/{checkin-form.tsx,week-strip.tsx,month-heatmap.tsx,mood-history.tsx}`
- Test: `tests/unit/mood-ui.test.tsx`

**Interfaces:**
- Consumes: Task 5 store + selectors, `MoodPicker`.
- Produces: full check-in (mood, default tags incl. Study/Học tập, custom tags stored in localStorage `mc:custom-tags` max 12, note — note field shows "Unlock your vault to add a note" when locked), week strip (7 coloured dots with weekday initials, empty = outline ring), month heatmap (prev/next month, cells coloured by mood, `aria-label` "<date>: <mood>", click/Enter opens day detail with that day's logs and decrypted notes), history list with delete. Legend of the 5 moods. `<AdBanner placement="mood" />` at the bottom.
- [ ] **Step 1: Failing tests:** submit Anxious + tags Work, Study + note "exam" → strip's today dot has `data-mood="anxious"`; heatmap cell for today has `aria-label` containing "Anxious"/"Lo âu"; opening the day shows "exam"; deleting the log empties today's dot.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** Commit `feat(mood): check-in form, week strip and month heatmap`.

### Task 11: Sanctuary — breathing, sounds, tonight's music, sleep timer

**Files:**
- Create: `lib/breathing.ts`, `lib/audio/engine.ts` (move from `lib/audio-engine.ts`), `lib/audio/tonight.ts`, `scripts/generate-music.mjs`, `public/audio/music/*.wav`, `app/[lang]/sanctuary/page.tsx`, `components/modules/sanctuary/{box-breathing.tsx,sound-mixer.tsx,tonight-card.tsx,sleep-timer.tsx}`
- Modify: `lib/sounds.ts` (v1 shows only `isPremium: false` ambient tracks — premium ones stay in the catalogue for v1.1, filtered out of the mixer; add `moods?: MoodType[]` to `SoundTrack` in `types/index.ts`; add music tracks with `category: 'music'`; titles via dictionary keys `t.sounds.<id>`), `components/shell/mini-audio-bar.tsx` (wire), `hooks/use-audio.ts`, `package.json` (`gen:audio` runs both scripts)
- Delete: `lib/audio-engine.ts`
- Test: `tests/unit/breathing.test.ts`, `tests/unit/tonight.test.ts`, `tests/unit/audio-engine.test.ts`

**Interfaces:**
- Produces: `BREATH_PHASES = ['inhale','hold-in','exhale','hold-out'] as const`, `PHASE_MS = 4000`, `CYCLES = 4`, `breathAt(elapsedMs: number): { phase; secondsLeft: 1|2|3|4; cycle: 1..4; progress: number /*0..1 within phase*/; done: boolean }`; `pickTonightTrack(tracks: SoundTrack[], mood: MoodType | null, date: Date): SoundTrack` (music tracks whose `moods` include `mood`, else all music; stable per day via `dayKey` hash); engine additions: `setSleepTimer(minutes: 10 | 20 | 30 | 60 | null)`, `AudioState.sleepEndsAt: number | null`, fade master gain linearly to 0 over the last 60 s then `stopAll()` and restore the user's master volume.
- Music placeholders: `scripts/generate-music.mjs` (same WAV writer as `generate-ambient.mjs`, extract the writer into `scripts/wav.mjs`) renders 6 × 60 s soft piano-like pieces (additive sine partials with exponential decay, slow chord progressions, 60–72 BPM, gentle reverb via a few feedback delays) tagged: `piano-still` [heavy, numb], `piano-dawn` [hopeful, peaceful], `lofi-rain` [anxious, heavy], `lofi-slow` [anxious, numb], `piano-drift` [peaceful], `piano-letter` [heavy, hopeful].
- Breathing UI: SVG rounded square; a dot travels one side per phase; inner square scales 0.6→1 on inhale, holds, 1→0.6 on exhale; phase word + seconds-left; Start / Stop; resets in a `useLayoutEffect` cleanup (Activity hide). Reduced motion: no travelling dot, text only.
- Tonight card: "Tonight's music" / "Nhạc của đêm nay", based on the latest mood log today (else `null`), play/pause, plays alongside ambient sounds.
- Mini audio bar: visible when `playing` or `held` is non-empty; names, play/pause all, stop, sleep-timer remaining (mm:ss is a timer the user set, not a counter); desktop bottom-right pill, mobile above the tab bar; never hidden by the vent overlay (`z-50`).
- [ ] **Step 1: Failing tests:** `breathAt(0)` → inhale, secondsLeft 4, cycle 1; `breathAt(4000)` → hold-in; `breathAt(15_999)` → hold-out, secondsLeft 1; `breathAt(64_000).done` true. `pickTonightTrack` with mood `heavy` returns a track whose `moods` include heavy; same date → same track; `null` mood → any music track, stable. Engine (mock `HTMLMediaElement.prototype.play/pause`): `setSleepTimer(10)` → `sleepEndsAt = now+600_000`; advancing fake timers to +570 s → element volume ≈ half of user volume; +600 s → `playing` empty and `master` restored.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement + `npm run gen:audio`. **Step 4:** PASS; listen to two music files locally.
- [ ] **Step 5:** Commit `feat(sanctuary): box breathing, ambient mixer, tonight's music, sleep timer`.

### Task 12: Settings and first-run notice

**Files:**
- Create: `app/[lang]/settings/page.tsx`, `components/modules/settings/{settings-view.tsx,data-section.tsx}`, `components/modules/onboarding/first-run-notice.tsx`
- Test: `tests/unit/settings.test.tsx`

**Interfaces:**
- Produces: sections — Language (`setLocale`), Appearance (Dusk/Mist via `next-themes`), Vault (link to vault settings), Account (Task 16 fills; render nothing before), Privacy (anonymous statistics switch → `setAnalyticsEnabled`, Task 18; render the switch now bound to localStorage `mc:analytics` default `true`), Data (Export JSON: `{ exportedAt, moods, journal }` with journal still encrypted, filename `mindcocoon-export-YYYY-MM-DD.json`; Erase everything: type-to-confirm word "xóa"/"erase", calls `wipeVault()`, `clearMoods()`, clears `mc:*` localStorage, reloads), About (not-a-substitute disclaimer, link to `/help`).
- First-run notice: one-time dialog (localStorage `mc:first-run-seen`) with the disclaimer (spec §8) and the help link; never shown on `/help`.
- [ ] **Step 1: Failing tests:** export produces JSON whose `journal[0].content` matches `/^v1\./`; erase requires the exact word, then storage lists are empty.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** Commit `feat(settings): settings, export, erase and first-run notice`.

### Task 13: PWA — manifest, offline, persistence

**Files:**
- Create: `app/manifest.ts`, `app/icon.svg`, `app/apple-icon.png` (generated from the svg via a small script or committed), `public/sw.js`, `lib/pwa.ts`, `components/modules/pwa/{sw-register.tsx,install-hint.tsx}`
- Test: `tests/unit/pwa.test.ts`; offline check in Task 19 e2e

**Interfaces:**
- Produces: `requestPersistentStorage(): Promise<boolean>` (calls `navigator.storage.persist()` once, remembers result in `mc:persisted`), `isStandalone(): boolean`, `shouldShowInstallHint(now, state): boolean` (iOS Safari not standalone, after ≥ 2 visits, at most once per 14 days, never on `/vent`).
- `sw.js`: version constant `CACHE = 'mc-v1'`; on install precache `/vi`, `/en`, `/vi/help`, `/en/help`, `/vi/vent`, `/en/vent`, `/manifest.webmanifest`, icons; navigations network-first with cache fallback (cache successful navigations); `/_next/static/*` cache-first; `/audio/*` cache-on-first-play (cache-first after); delete old caches on activate. Registered only in production. Read `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md` §8 for the `/sw.js` headers to add in `next.config.ts`.
- Manifest: name "MindCocoon", `start_url: '/'`, `display: 'standalone'`, `background_color`/`theme_color` `#0F172A`, icons 192/512 + maskable.
- [ ] **Step 1: Failing tests:** `shouldShowInstallHint` true on 2nd visit iOS non-standalone, false when standalone, false 3 days after last shown, false on vent path.
- [ ] **Step 2–4:** FAIL → implement → PASS. Call `requestPersistentStorage()` after the first vault save or mood log.
- [ ] **Step 5:** Commit `feat(pwa): manifest, offline service worker and storage persistence`.

### Task 14: Ad slots (off by default)

**Files:**
- Create: `lib/ads/config.ts`, `components/modules/ads/ad-banner.tsx`
- Modify: `.env.example` (`NEXT_PUBLIC_ADS_ENABLED`, `NEXT_PUBLIC_ADSENSE_CLIENT`, `NEXT_PUBLIC_ADSENSE_SLOT_TODAY`, `NEXT_PUBLIC_ADSENSE_SLOT_MOOD`, `NEXT_PUBLIC_QUIET_HOURS`)
- Delete: `lib/entitlements.ts`, `hooks/use-entitlements.ts` (Pro returns in v1.1)
- Test: `tests/unit/ads.test.ts`

**Interfaces:**
- Produces: `type AdPlacement = 'today' | 'mood'`, `getAdsConfig(): { enabled: boolean; client?: string; slots: Partial<Record<AdPlacement,string>>; quietHours: [number, number] | null }` (parses `"23-5"`; invalid/empty → null), `isQuietHour(date: Date, range: [number, number] | null): boolean`, `canShowAd(p: { placement: AdPlacement; now: Date; config }): boolean`, `<AdBanner placement>` — renders nothing unless `canShowAd`; loads the AdSense script once with `next/script` `afterInteractive`, sets `requestNonPersonalizedAds = 1`, fixed-height container (no layout shift), muted label "Ad"/"Quảng cáo".
- [ ] **Step 1: Failing tests (Review Focus 5):** `isQuietHour` with `[23,5]`: 23:00 true, 04:59 true, 05:00 false, 22:59 false; `[1,3]`: 02:00 true, 03:00 false; `null` → always false. `canShowAd` false when `enabled` false, when no slot for placement, when quiet.
- [ ] **Step 2–4:** FAIL → implement → PASS. Replace the Task 6/10 placeholders.
- [ ] **Step 5:** Commit `feat(ads): config-driven banner slots with quiet hours`.

---

## Part B — Accounts, backup, analytics

### Task 15: Supabase project, schema, client

**Files:**
- Create: `supabase/migrations/0001_init.sql`, `lib/supabase/client.ts`, `docs/SUPABASE.md`
- Modify: `.env.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` server-only), `package.json` (`@supabase/supabase-js`, exact pinned version — no `@supabase/ssr`: the app is client-only/local-first, sessions live in localStorage, and `proxy.ts` stays locale-only)
- Load the project skills `.claude/skills/supabase` and `.claude/skills/supabase-postgres-best-practices` before writing SQL or client code.

**Interfaces:**
- Produces: `getSupabase(): SupabaseClient | null` (null when env vars missing — every caller degrades to local-only), tables:
```sql
-- vault_backups: one row per user, ciphertext only
create table public.vault_backups (
  user_id uuid primary key references auth.users on delete cascade,
  ciphertext text not null,              -- sealed snapshot (v1 envelope)
  wraps jsonb not null,                  -- { passcode?: KdfWrap, recovery: KdfWrap }
  snapshot_version int not null default 1,
  updated_at timestamptz not null default now()
);
-- vault_recovery_secrets: server half used only for same-device passcode reset
create table public.vault_recovery_secrets (
  user_id uuid primary key references auth.users on delete cascade,
  secret text not null default encode(gen_random_bytes(32), 'base64'),
  created_at timestamptz not null default now()
);
-- app_opens: anonymous counts, insert-only
create table public.app_opens (
  id bigint generated always as identity primary key,
  device_id uuid not null,
  hour_bucket timestamptz not null,
  locale text not null check (locale in ('vi','en'))
);
```
  RLS: enable on all three. Policies use `to authenticated` + `(select auth.uid()) = user_id`; every UPDATE policy has both `using` and `with check`, and each table that is updated also has a SELECT policy. `vault_recovery_secrets`: select + insert only (no update/delete from clients). `app_opens`: insert policy `to anon, authenticated` with `with check (hour_bucket = date_trunc('hour', hour_bucket))`, no select policy. Explicit `grant` statements for `anon`/`authenticated` on exactly these operations (Data API may not auto-expose new tables). Unique index on `app_opens (device_id, hour_bucket)`. No `security definer` functions.
- [ ] **Step 1: Provision — DONE (2026-10-16):** project `apqhxpcgtpzayswgdcqw` exists; keys are in `.env.local` (git-ignored). Remaining user actions: create the Supabase project — preferred via Vercel Marketplace (`vercel integration add supabase`, then `vercel env pull .env.local`) or supabase.com; enable Email (OTP) and Google providers; add redirect URLs `http://localhost:3000/*/auth/callback` and the production domain. Record steps in `docs/SUPABASE.md`. **Pause and ask the user for credentials if not available — do not invent keys.**
- [ ] **Step 2:** Apply the migration (`supabase db push` or SQL editor). Verify with an anon client in a scratch script: insert into `app_opens` succeeds, select returns 0 rows; select from `vault_backups` as anon returns 0 rows.
- [ ] **Step 3:** Implement `getSupabase()` (browser singleton, `auth: { persistSession: true, flowType: 'pkce' }`). `npm run typecheck`.
- [ ] **Step 4:** Commit `feat(supabase): schema with RLS and browser client`.

### Task 16: Sign-in (16+), account management

**Files:**
- Create: `lib/auth/store.ts`, `hooks/use-auth.ts`, `components/modules/account/{sign-in-dialog.tsx,age-gate.tsx,account-section.tsx}`, `app/[lang]/auth/callback/page.tsx`, `app/api/account/route.ts`
- Test: `tests/unit/auth.test.tsx`

**Interfaces:**
- Produces: `useAuth(): { status: 'disabled' | 'loading' | 'signed-out' | 'signed-in'; user: { id: string; email?: string } | null }` (`'disabled'` when `getSupabase()` is null), `signInWithEmail(email): Promise<void>` (OTP code, 6 digits, `verifyEmailOtp(email, code)`), `signInWithGoogle(): Promise<void>` (redirect to `/<lang>/auth/callback`), `signOut()`, `deleteAccount(): Promise<void>` (calls `DELETE /api/account` with the access token; the route verifies the JWT with the anon client, then deletes the auth user with the service-role key — cascades remove backups/secrets; read `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`).
- Age gate: before any sign-in UI, a single question "Are you 16 or older?" / "Bạn từ 16 tuổi trở lên?" — No → explains backup needs an account and suggests installing the app; stores `mc:age-ok` = `'yes' | 'no'`; `'no'` hides every login nudge (spec §4.3, §6.1).
- `AccountSection` in Settings: signed-out → "Sign in to back up" button; signed-in → email, backup status (Task 17), Sign out, Delete account (type-to-confirm).
- [ ] **Step 1: Failing tests** (mock `getSupabase`): age gate "No" → sign-in form never renders and `mc:age-ok` is `'no'`; "Yes" → email form; `useAuth` returns `'disabled'` when the client is null and the Account section renders nothing.
- [ ] **Step 2–4:** FAIL → implement → PASS. Manual: OTP and Google sign-in against the real project.
- [ ] **Step 5:** Commit `feat(auth): optional 16+ sign-in and account deletion`.

### Task 17: End-to-end encrypted backup and restore

**Files:**
- Create: `lib/backup/snapshot.ts`, `lib/backup/remote.ts`, `lib/backup/supabase-remote.ts`, `lib/backup/engine.ts`, `hooks/use-backup.ts`, `components/modules/account/{restore-dialog.tsx,conflict-dialog.tsx,backup-nudge.tsx}`
- Modify: `components/modules/vault/forgot-passcode.tsx` (enable "Sign in to reset"), Settings account section (status)
- Test: `tests/unit/backup.test.ts` (node env + fake-indexeddb)

**Interfaces:**
- Consumes: `getUnlockedDek`, `onVaultChange`, `attachServerSecret`, `unlockWithServerSecret`, `reloadVault`, keyring `backupWraps` + `adoptBackupWraps`, mood store, `useAuth`.
- Produces:
```ts
interface Snapshot { version: 1; createdAt: string; journal: JournalEntry[]; moods: MoodLog[] }
interface RemoteBackup { ciphertext: string; wraps: Pick<Keyring,'passcode'|'recovery'>; updatedAt: string }
interface BackupRemote {
  fetch(): Promise<RemoteBackup | null>
  put(b: Omit<RemoteBackup,'updatedAt'>): Promise<void>
  getServerSecret(): Promise<string>
}
buildSnapshot(): Promise<Snapshot>
sealSnapshot(s: Snapshot, dek: UnlockedDek): Promise<string>
openSnapshot(ciphertext: string, dek: UnlockedDek): Promise<Snapshot>
createBackupEngine(remote: BackupRemote): {
  start(): () => void                 // subscribes to vault + mood changes; debounced push 5s; retry 5s→10s→…→5min on failure / offline
  pushNow(): Promise<void>
  status(): 'idle' | 'pending' | 'synced' | 'error'
  restore(secret: { recoveryCode: string } | { passcode: string }): Promise<boolean>   // replaces local data + keyring wraps
  onSignedIn(): Promise<'pushed' | 'restore-available' | 'conflict'>
}
```
- Rules (spec §6.1): requires a recovery code to exist before the first push (if none, prompt the user with `RecoveryCodeCard` first); the uploaded `wraps` never include `server`, `device`, `deviceReset`; the server secret is fetched only to call `attachServerSecret` (local `server` wrap) and `unlockWithServerSecret` in the forgot flow. `onSignedIn`: local empty + remote exists → `'restore-available'` (RestoreDialog asks for recovery code or passcode); local non-empty + remote exists with different content → `'conflict'` (ConflictDialog: "Keep this device's copy" → push / "Use the backup" → restore; nothing happens until the user picks); local non-empty + no remote → push → `'pushed'`.
- Login nudges (spec §4.3): `BackupNudge` shown (a) right after `setVaultPasscode` resolves, (b) once when the vault reaches 5 entries (localStorage `mc:nudge-5`), (c) static line in Settings; never when `mc:age-ok === 'no'` or signed in or auth `'disabled'`.
- [ ] **Step 1: Failing tests** with an in-memory `BackupRemote` fake:
  - seal/open round-trip equals the snapshot; ciphertext does not contain any journal body or mood note plaintext, nor the mood ids (`'heavy'`) as plain substrings.
  - push → fake's stored `wraps` has `recovery` and no `server`/`device`/`deviceReset` keys.
  - new device: wipe local stores, `restore({ recoveryCode: code })` → journal entries and moods equal the originals; wrong code → `false` and local stays empty.
  - **Review Focus 2:** local has 1 entry, remote has a different snapshot → `onSignedIn()` resolves `'conflict'` and the fake's `put` was not called; local data unchanged.
  - offline: fake `put` rejects twice then resolves → status goes `error` then `synced` after timers advance.
  - forgot passcode via server: `attachServerSecret(secret)` then lock → `unlockWithServerSecret(secret)` true.
- [ ] **Step 2–4:** FAIL → implement → PASS. Manual: sign in on two browsers, restore with the recovery code.
- [ ] **Step 5:** Commit `feat(backup): end-to-end encrypted cloud backup and restore`.

### Task 18: Anonymous open analytics

**Files:**
- Create: `lib/analytics.ts`, `components/modules/analytics/track-open.tsx`
- Modify: settings privacy switch (bind to `setAnalyticsEnabled`)
- Test: `tests/unit/analytics.test.ts`

**Interfaces:**
- Produces: `getDeviceId(): string` (uuid in localStorage `mc:device-id`), `isAnalyticsEnabled(): boolean` (default true), `setAnalyticsEnabled(v: boolean)`, `hourBucket(date: Date): string` (ISO, minutes/seconds zeroed, UTC), `trackAppOpen(now: Date, locale: Locale): Promise<void>` — once per page load, skipped when disabled or `getSupabase()` null, inserts `{ device_id, hour_bucket, locale }` and ignores unique-violation errors. `<TrackOpen />` mounted in the root layout.
- [ ] **Step 1: Failing tests** (mock client): payload keys are exactly `['device_id','hour_bucket','locale']`; `hourBucket(new Date('2026-10-16T01:47:12+07:00'))` → `'2026-10-15T18:00:00.000Z'`; disabled → no insert; second call same load → no insert.
- [ ] **Step 2–4:** FAIL → implement → PASS. Add a SQL snippet to `docs/SUPABASE.md` for "distinct devices per night (local 21:00–05:00)".
- [ ] **Step 5:** Commit `feat(analytics): anonymous hourly app-open counts`.

---

## Part C — Launch readiness

### Task 19: E2E flows, clean build, docs

**Files:**
- Create: `tests/e2e/{locale.spec.ts,vent.spec.ts,vault.spec.ts,mood.spec.ts,offline.spec.ts}`, `docs/LAUNCH_CHECKLIST.md`, `README.md` (rewrite)
- Modify: `CLAUDE.md` (final commands/architecture)

- [ ] **Step 1: E2E specs** (both projects): `/` with `Accept-Language: vi` → URL `/vi` and heading in Vietnamese; vent: type, release, after-release text visible, reload → textarea empty, IndexedDB has no journal; vault: save from vent, set passcode, lock, unlock; mood: one-tap check-in shows in week strip; offline (chromium, production build): visit `/en`, `/en/help`, then `context.setOffline(true)` → reload `/en/help` renders hotline list.
- [ ] **Step 2:** `npm run test:e2e` → all PASS.
- [ ] **Step 3:** `npm run typecheck && npm run lint && npm test && npm run build` → zero errors, zero warnings from lint.
- [ ] **Step 4:** `docs/LAUNCH_CHECKLIST.md` = spec §10 items as checkboxes plus: every `HOTLINES` entry verified (number + hours) and flipped to `verified: true`; phrase lists reviewed by a native speaker / mental-health professional; music replaced with licensed tracks; Privacy Policy + Terms pages; Supabase SMTP configured for production OTP mail; rotate the service-role key (it was shared in a chat session) — create a new `sb_secret_…` key, update Vercel env, disable legacy JWT keys; legal review (Nghị định 13/2023) done; AdSense application after traffic, then block sensitive categories (dating, alcohol, gambling, weight loss) in the AdSense dashboard.
- [ ] **Step 5:** `README.md` (Vietnamese + English sections): prerequisites (Node ≥ 22), `npm install`, `cp .env.example .env.local`, `npm run gen:audio`, `npm run dev`, tests, deploy on Vercel (link Supabase env vars, set `NEXT_PUBLIC_QUIET_HOURS`, keep ads disabled), how to flip feature flags (env + redeploy).
- [ ] **Step 6:** Commit `chore: e2e coverage, launch checklist and setup docs`.
