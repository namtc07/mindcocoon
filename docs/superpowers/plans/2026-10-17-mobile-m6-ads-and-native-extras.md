# Mobile M6 — Ads, rewarded sounds and native extras Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Tóm tắt (VI):** Chủ dự án chọn làm tính năng + quảng cáo trước, tạm bỏ tài khoản/sao lưu (M5). Giai đoạn này: cờ điều khiển từ xa (bảng `app_config` trên Supabase, không cần đăng nhập), AdMob (đồng ý UMP, chỉ quảng cáo không cá nhân hóa, xếp hạng Teen), banner cuối Hôm nay + Cảm xúc (giờ yên tĩnh 23–5, không bao giờ ở vùng cấm), quảng cáo có thưởng mở 4 âm premium trong 24 giờ, nhắc nhở buổi tối (tắt mặc định), mở két bằng Face ID/vân tay. **Pro (RevenueCat) để sau** vì cần sản phẩm trong App Store Connect / Play Console.

**Goal:** The app earns from a bottom banner and opt-in rewarded ads under the product's ad rules, can be switched remotely, and gains the evening reminder and biometric vault unlock.

**Architecture:** Pure decision logic (`src/lib/ads/policy.ts`, `src/lib/unlocks.ts`, `src/lib/reminder.ts` schedule maths) is Vitest-tested; thin native wrappers (`src/lib/ads/admob.ts`, `src/lib/remote-config.ts`, `src/lib/biometric.ts`, `src/lib/notifications.ts`) are mocked in Jest. Ads appear only through `<AdBanner placement/>` (Today, Mood) and `useRewardedUnlock()` (Sanctuary premium sounds).

**Tech Stack:** `react-native-google-mobile-ads` 17.2.0 (pinned; 17.3.0 is one day old), `expo-notifications` ~58.1.5, `expo-local-authentication` ~58.0.2, expo-secure-store (biometric-gated item), Supabase REST (PostgREST, publishable key) for `app_config`.

**Spec:** `docs/superpowers/specs/2026-10-17-mindcocoon-mobile-design.md` §4 (Native thêm: nhắc nhở buổi tối, Face ID), §5.1 (quảng cáo), §8 M6; web ad rules `docs/superpowers/specs/2026-10-16-mindcocoon-design.md` §5.1.

## Global Constraints

- **Ad-free zones, always:** Vent, Vault, breathing (whole Sanctuary except the user-pressed rewarded button), after-release, Help, Settings, first-run notice. No interstitials, no app-open ads, no audio ads, no auto-playing video.
- **Banner:** one adaptive banner at the end of Today and Mood scroll content (must scroll to see); hidden in quiet hours (default 23–5, local time); hidden whenever ads are off.
- **Rewarded:** only on a user tap ("Watch an ad to unlock for 24 hours"); allowed in quiet hours; unlocks one premium sound for 24 h.
- **Non-personalised only:** every request `requestNonPersonalizedAdsOnly: true`; request configuration `maxAdContentRating: MaxAdContentRating.T`, `tagForChildDirectedTreatment: false`; **no ATT prompt**; run UMP consent (`AdsConsent.gatherConsent()`) before the first ad request.
- **Ads are off unless the remote flag says on** (`ads_enabled` default `false`, matching the project rule "ads are off by default"); dev builds always use Google test IDs (`TestIds.*`).
- No counters/streaks in reminder copy; reminder off by default; user picks 21:00 / 22:00 / 23:00.
- Biometric unlock only when a passcode is set; the passcode is the thing stored, in a `requireAuthentication: true`, `WHEN_PASSCODE_SET_THIS_DEVICE_ONLY` secure-store item; any passcode change/removal/reset or erase deletes it.
- Strings only in core dictionaries (en/vi parity test). All M3/M4 constraints (theme tokens, 44 pt, Reduce Motion, roles/labels) hold.
- Supabase work: load `.claude/skills/supabase` and `.claude/skills/supabase-postgres-best-practices` first; migrations are applied by the owner.
- Install Expo packages with `npx expo install`; run from `mobile/`: `npm run typecheck && npx expo lint && npm test`; web `npm test` stays green. After Task 3: `npx expo prebuild --clean -p ios && (cd ios && pod install) && npx expo run:ios`.
- Commit per task (Conventional Commits + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`), only on a green gate.

## Decisions taken in this plan [Claude quyết]

- Remote flags (`app_config`) are read anonymously over REST with the publishable key, cached in prefs, refreshed at start and on foreground at most every 6 h; unreachable → last cached value → built-in defaults (ads off).
- AdMob init runs after the first-run notice has been dismissed (no consent form over the welcome) and only when `ads_enabled` is true.
- Premium sounds use the web's generated placeholder files (copied like M4).
- Biometric unlock stores the passcode (not the data key) so `@mindcocoon/core` and its golden vectors stay untouched.

## Review Focus

1. **Ads leaking into a forbidden screen** (e.g. a banner left mounted under Vent's full-screen layout, or rendered on Help) → Task 4 test renders every forbidden screen and asserts no `ad-banner`.
2. **Quiet-hours edges** (22:59 shows, 23:00 hides, 04:59 hides, 05:00 shows; wrap past midnight; remote override like `[0, 6]`) → Task 1 tests.
3. **Remote config garbage** (missing keys, wrong types, network timeout, HTTP 500) must fall back without crashing and never turn ads on by accident → Task 2 tests.
4. **Rewarded ad closed early / failed to load** → no unlock, a calm toast, the sound stays locked → Task 5 tests.
5. **Stale biometric secret after a passcode change or reset** → Face ID must not unlock with the old passcode (item deleted; a failed unlock deletes it and falls back to the passcode field) → Task 7 tests.

---

## File Map

```
supabase/migrations/0003_app_config.sql             table + RLS + anon select grant + seed rows
mobile/src/lib/ads/policy.ts                         RemoteFlags, DEFAULT_FLAGS, parseFlags, canShowBanner
mobile/src/lib/remote-config.ts                      fetchFlags, useFlags, refresh on start/foreground
mobile/src/lib/ads/admob.ts                          consent + init + unit ids + request options
mobile/src/components/ads/AdBanner.tsx
mobile/src/lib/unlocks.ts, src/hooks/use-rewarded-unlock.ts
mobile/src/lib/reminder.ts (+ notifications wiring), src/components/settings/ReminderSettings.tsx
mobile/src/lib/biometric.ts, vault UI changes
mobile/assets/audio/{thunder,stream,singing-bowl,deep-hum}.m4a
```

---

### Task 1: Ad policy (pure)

**Files:** Create `mobile/src/lib/ads/policy.ts`, `mobile/test/ads-policy.test.ts`.

**Interfaces — Produces:**
```ts
export type AdPlacement = "today" | "mood";
export interface RemoteFlags { adsEnabled: boolean; rewardedEnabled: boolean; quietHours: [number, number] | null }
export const DEFAULT_FLAGS: RemoteFlags; // { adsEnabled: false, rewardedEnabled: false, quietHours: [23, 5] }
export function parseFlags(rows: unknown): RemoteFlags;      // rows = [{key, value}] from app_config; unknown/invalid → default per key
export function canShowBanner(p: { placement: AdPlacement; now: Date; flags: RemoteFlags; ready: boolean }): boolean;
export function canOfferRewarded(p: { flags: RemoteFlags; ready: boolean }): boolean; // ignores quiet hours
```
Keys: `ads_enabled` (boolean), `rewarded_enabled` (boolean), `quiet_hours` (`[start, end]` ints 0–23, start ≠ end, or `null` to disable). Reuse core `isQuietHour`.

- [ ] **Step 1: Failing tests:** `defaults keep ads off`; `parses valid rows`; `ignores garbage per key` (`ads_enabled: "yes"`, `quiet_hours: [25, 3]`, `rows: "oops"` → defaults for those keys, others kept); `quiet hours edges` (22:59 true, 23:00 false, 04:59 false, 05:00 true with flags on and ready); `a remote [0, 6] window`; `null quiet hours shows all day`; `banner needs ads on and SDK ready`; `rewarded ignores quiet hours but needs rewarded on and ready`.
- [ ] **Step 2: Run** `cd mobile && npx vitest run test/ads-policy.test.ts` — Expected: FAIL (module missing).
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** — PASS; full gate green.
- [ ] **Step 5: Commit** `feat(mobile): ad policy with quiet hours and remote flags parsing`.

### Task 2: Remote flags (`app_config`)

**Files:** Create `supabase/migrations/0003_app_config.sql`, `mobile/src/lib/remote-config.ts`, `mobile/test/remote-config.test.ts`; modify `mobile/src/lib/prefs.ts` (`flags?: { value: RemoteFlags; fetchedAt: number }`), `mobile/src/app/_layout.tsx`, `mobile/.env.local` (git-ignored; `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` = the publishable key from the root `.env.local`), `mobile/.env.example`.

Migration: `create table public.app_config (key text primary key, value jsonb not null, updated_at timestamptz not null default now())`; RLS on; policy `app_config: anyone reads` for select to anon, authenticated using (true); `grant select on public.app_config to anon, authenticated` (0002 revoked defaults); seed `ads_enabled=false`, `rewarded_enabled=false`, `quiet_hours=[23,5]`.

**Interfaces — Produces:** `createRemoteConfig(deps: { fetch: typeof fetch; url?: string; key?: string; now: () => number; load(): {value, fetchedAt} | undefined; save(v): void })` → `{ getFlags(): RemoteFlags; refresh(force?: boolean): Promise<void>; subscribe(l): () => void }`; app instance `remoteConfig` + `useFlags()` in `remote-config.ts`; refresh on start (after `loadPrefs`) and on AppState `active` when older than 6 h. Request: `GET {url}/rest/v1/app_config?select=key,value` with headers `apikey`, `Authorization: Bearer {key}`, 4 s timeout (`AbortController`).

- [ ] **Step 1: Failing tests (Vitest, fake fetch):** `starts from the cache, else defaults`; `refresh stores parsed flags and timestamp`; `skips refresh within 6 hours unless forced`; `timeout, HTTP 500 and bad JSON keep the cached flags`; `no url/key → never fetches`; `sends the publishable key headers`.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement** (load the Supabase skills before writing the migration). **Step 4:** PASS + gate.
- [ ] **Step 5: Commit** `feat: app_config remote flags (migration + mobile client)`.

### Task 3: AdMob SDK, consent and initialisation

**Files:** `mobile/package.json` (`npm i react-native-google-mobile-ads@17.2.0 -w @mindcocoon/mobile`), `mobile/app.json` plugin `["react-native-google-mobile-ads", { "androidAppId": "ca-app-pub-3940256099942544~3347511713", "iosAppId": "ca-app-pub-3940256099942544~1458002511", "delayAppMeasurementInit": true, "userTrackingUsageDescription": false }]` (Google's sample app IDs — the owner replaces them with real ones), create `mobile/src/lib/ads/admob.ts`, `mobile/__tests__/admob.test.tsx`; jest mock for the library in `jest.setup.ts`.

**Interfaces — Produces:** `startAds(): Promise<void>` (idempotent: `AdsConsent.gatherConsent()` → `mobileAds().setRequestConfiguration({ maxAdContentRating: MaxAdContentRating.T, tagForChildDirectedTreatment: false, tagForUnderAgeOfConsent: false })` → `mobileAds().initialize()`; consent errors are swallowed but still initialise with non-personalised requests); `useAdsReady(): boolean`; `AD_REQUEST = { requestNonPersonalizedAdsOnly: true }`; `adUnitId(kind: "banner-today" | "banner-mood" | "rewarded"): string` (`__DEV__` → `TestIds.ADAPTIVE_BANNER` / `TestIds.REWARDED`; release → `Constants.expoConfig.extra.admob[platform][kind]`, missing → empty string = no ad). Root layout calls `startAds()` once flags say `adsEnabled || rewardedEnabled` and `firstRunSeen` is true.

- [ ] **Step 1: Failing tests:** `waits for the first-run notice and the remote flag`; `gathers consent before initialising`; `still initialises when consent fails`; `sets a Teen rating and no child-directed tag`; `uses test ids in development`; `starts only once`.
- [ ] **Step 2–4:** FAIL → implement → PASS + gate; `npx expo config --type introspect | grep -E "GADApplicationIdentifier|NSUserTrackingUsageDescription|com.google.android.gms.ads.APPLICATION_ID"` — Expected: both app IDs present, **no** `NSUserTrackingUsageDescription`.
- [ ] **Step 5: Commit** `feat(mobile): AdMob consent and non-personalised setup`.

### Task 4: Banner on Today and Mood only

**Files:** Create `mobile/src/components/ads/AdBanner.tsx`, `mobile/__tests__/ads.test.tsx`; modify `src/app/(tabs)/index.tsx`, `src/app/(tabs)/mood.tsx` (banner as the last child of the scroll content).

**Interfaces:** `<AdBanner placement: AdPlacement />` renders `BannerAd` (`size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}`, `unitId={adUnitId("banner-" + placement)}`, `requestOptions={AD_REQUEST}`) inside a `View testID="ad-banner"` only when `canShowBanner(...)` (now from `useNow`); on `onAdFailedToLoad` it collapses (renders nothing).

- [ ] **Step 1: Failing tests:** `Today shows the banner at the end when ads are on`; `hidden in quiet hours` (fake time 23:30); `hidden when ads are off`; `collapses when the ad fails to load`; `never on Vent, Vault, Sanctuary, Help, Settings or after release` (render each screen with ads on, ready, at noon → no `ad-banner`).
- [ ] **Step 2–4:** FAIL → implement → PASS + gate.
- [ ] **Step 5: Commit** `feat(mobile): adaptive banner on Today and Mood`.

### Task 5: Rewarded unlock of premium sounds

**Files:** Copy `public/audio/{thunder,stream,singing-bowl,deep-hum}.m4a` to `mobile/assets/audio/`; modify `src/lib/audio/sources.ts`, `src/lib/audio/index.ts` (trackIds include premium), `src/components/sanctuary/SoundMixer.tsx`; create `src/lib/unlocks.ts`, `src/hooks/use-rewarded-unlock.ts`, `test/unlocks.test.ts`, tests in `__tests__/sanctuary.test.tsx`; dictionary keys `sanctuary.moreSounds` ("More sounds" / "Thêm âm thanh"), `sanctuary.unlockWithAd` ("Watch an ad to unlock {name} for 24 hours" / "Xem quảng cáo để mở {name} trong 24 giờ"), `sanctuary.unlockedUntil` ("Unlocked until {time}" / "Mở đến {time}"), `sanctuary.adUnavailable` ("No ad right now. Try again later." / "Chưa có quảng cáo lúc này. Thử lại sau nhé.").

**Interfaces:** `unlocks.ts`: `isUnlocked(id, now): boolean`, `unlockFor24h(id, now): Promise<void>`, `unlockedUntil(id): number | null` (prefs `unlocks?: Record<string, number>`; expired entries pruned on write); `useRewardedUnlock(): { offer: boolean; unlock(id): Promise<"unlocked" | "unavailable" | "dismissed"> }` using `RewardedAd.createForAdRequest(adUnitId("rewarded"), AD_REQUEST)`, resolves on `RewardedAdEventType.EARNED_REWARD` → `unlockFor24h`, on `AdEventType.CLOSED` without reward → `"dismissed"`, on `AdEventType.ERROR` or 10 s load timeout → `"unavailable"`.

SoundMixer gains a "More sounds" group: unlocked premium tracks behave like free ones plus "Unlocked until 23:40"; locked ones show a lock icon and the unlock button (only when `offer`); a premium track that expires keeps playing until paused (checked at play time only).

- [ ] **Step 1: Failing tests:** Vitest `unlock lasts 24 hours`, `expired unlocks are pruned`; Jest `earning the reward unlocks the sound`, `closing early keeps it locked`, `a failed ad shows "No ad right now…"`, `no unlock button when rewarded is off`, `allowed in quiet hours`, `the play button for a locked sound is not offered`.
- [ ] **Step 2–4:** FAIL → implement → PASS + gate.
- [ ] **Step 5: Commit** `feat(mobile): rewarded ads unlock premium sounds for 24 hours`.

### Task 6: Evening reminder

**Files:** `npx expo install expo-notifications`; create `src/lib/reminder.ts`, `src/components/settings/ReminderSettings.tsx`, `test/reminder.test.ts`, tests in `__tests__/settings.test.tsx`; modify `src/app/settings.tsx`, `src/lib/export.ts` (erase cancels), `src/app/_layout.tsx` (reschedule on locale change), `app.json` plugin `expo-notifications`; dictionary keys `settings.reminderTitle` ("Evening reminder" / "Nhắc nhở buổi tối"), `settings.reminderHint` ("A gentle nudge at night. Off unless you turn it on." / "Một lời nhắc nhẹ vào buổi tối. Chỉ bật khi bạn muốn."), `settings.reminderDenied` ("Notifications are off for MindCocoon in your phone's settings." / "Thông báo của MindCocoon đang tắt trong cài đặt điện thoại."), `reminder.title` ("MindCocoon"), `reminder.body` ("A quiet place is here if today was heavy." / "Nếu hôm nay nặng nề, ở đây có một góc yên tĩnh cho bạn.").

**Interfaces:** prefs `reminder?: { hour: 21 | 22 | 23 } | null`; `setReminder(hour | null, t): Promise<"scheduled" | "off" | "denied">` (requests permission on enable; cancels any previous `mindcocoon-evening` notification, schedules `{ type: SchedulableTriggerInputTypes.DAILY, hour, minute: 0 }` with identifier `mindcocoon-evening`); `rescheduleReminder(t)` re-applies the saved hour (used on locale change).

- [ ] **Step 1: Failing tests:** `off by default`; `turning it on asks permission and schedules daily at 22:00`; `denied permission leaves it off and explains`; `changing the hour replaces the schedule`; `turning it off cancels`; `copy follows the language`; `erase everything cancels it`.
- [ ] **Step 2–4:** FAIL → implement → PASS + gate.
- [ ] **Step 5: Commit** `feat(mobile): optional evening reminder`.

### Task 7: Face ID / fingerprint vault unlock

**Files:** `npx expo install expo-local-authentication`; plugin `["expo-local-authentication", { "faceIDPermission": "Allow MindCocoon to use Face ID to open your private vault." }]` and secure-store `faceIDPermission` (same text); create `src/lib/biometric.ts`, `__tests__/biometric.test.tsx`; modify `src/components/vault/{VaultSettings,UnlockPanel,ForgotPasscode}.tsx`, `src/lib/export.ts`; dictionary keys `vault.biometricToggle` ("Unlock with {method}" / "Mở bằng {method}"), `vault.biometricConfirm` ("Enter your passcode to turn this on" / "Nhập mã khóa để bật"), `vault.biometricFailed` ("Couldn't use {method}. Enter your passcode." / "Không dùng được {method}. Hãy nhập mã khóa."), `vault.methodFace` ("Face ID"), `vault.methodFingerprint` ("fingerprint" / "vân tay").

**Interfaces:** `biometricMethod(): Promise<"face" | "fingerprint" | null>` (hardware + enrolled); `enableBiometric(passcode): Promise<boolean>` (verifies the passcode with core `unlockWithPasscode` — it rejects a wrong one — then `SecureStore.setItemAsync("vault-biometric", passcode, { requireAuthentication: true, keychainAccessible: WHEN_PASSCODE_SET_THIS_DEVICE_ONLY })`); `unlockWithBiometric(): Promise<"unlocked" | "cancelled" | "failed">` (read prompts Face ID; wrong stored passcode → delete item, `"failed"`); `disableBiometric()`; `isBiometricEnabled(): boolean` (prefs flag `biometric?: true`, since a gated item can't be probed without a prompt).

- [ ] **Step 1: Failing tests:** `toggle appears only with a passcode and enrolled biometrics`; `turning it on needs the passcode`; `Unlock with Face ID opens the vault`; `cancelling keeps the passcode field`; `changing or removing the passcode turns it off`; `a stale stored passcode is deleted and falls back to the passcode field`; `erase everything deletes it`.
- [ ] **Step 2–4:** FAIL → implement → PASS + gate.
- [ ] **Step 5: Commit** `feat(mobile): Face ID / fingerprint vault unlock`.

### Task 8: Report and owner checklist

**Files:** Create `docs/mobile/M6-report.md`: what exists; owner set-up — apply migration 0003 in Supabase; create AdMob apps (iOS + Android) and units (banner Today, banner Mood, rewarded) and put them in `app.json` (`plugins` app IDs, `extra.admob`); in AdMob block sensitive categories (dating, alcohol, gambling, weight loss) and set max rating Teen; add `app-ads.txt` on the website later; set up UMP messages (EEA/UK) in AdMob Privacy & messaging; flip `ads_enabled`/`rewarded_enabled` to `true` in `app_config` when ready. Device checklist: test banner on Today/Mood only, hidden 23–5; rewarded test ad unlocks Thunder for 24 h; reminder arrives at the chosen hour (set device clock); Face ID unlock (simulator: Features → Face ID → Enrolled / Matching face), passcode change disables it.

- [ ] Write the report; full gate + web; commit `docs(mobile): M6 report and owner set-up`.
