# M3 features — report

Branch `feat/mobile-m3` (on top of `feat/mobile-m2`). iOS only; Android not run (owner's call).

## What exists

- **Today**: greeting + date, heavy-week nudge (on-device, at most once a week), today's prompt
  ("Write about this" opens Vent with it, "Another one"), one-tap mood check-in, then optional tags +
  encrypted note (asks for the passcode inline when the vault is locked), entry links.
- **Vent**: full screen (no header, no tab bar), autocorrect/suggestions off, word-by-word Reanimated
  dissolve into embers (Reduce Motion → short fade) + success haptic, "Let go." screen; the text is
  never stored and the input is remounted afterwards. Gentle card once per session for risky words.
  Save to vault (title, inline passcode when locked). Covered by a privacy screen in the app switcher.
- **Vault**: list → reader (edit, delete with confirm), settings sheet (set/change/remove passcode,
  lock now, auto-lock 1/5/15/30 min, new recovery code), 12-word recovery card (copy, must confirm),
  unlock, forgot flow (recovery code → new passcode, or 1-hour reset on this device),
  "can't open right now" + Try again when the Keychain can't be read (never offers a reset).
  Auto-lock on return from background and after foreground idle time.
- **Mood journey**: full check-in (default + up to 12 own tags, encrypted note), week strip, month
  map (Monday first, today ringed, no future months), day detail with decrypted notes, legend,
  history (latest 30, delete with confirm). No counts, scores or percentages.
- **Help**: bundled support lines (Vietnam first in Vietnamese, answering-now first), Call → phone
  dialer, findahelpline link, disclaimer; works offline. Dev builds warn the numbers are unverified.
- **Settings**: + vault link, "Download a copy" (JSON via the share sheet; journal and notes stay
  encrypted), "Erase everything" (type `erase`; wipes vault, Keychain key, check-ins, preferences),
  about + support lines. First-run welcome shows once, never over Help.

New native modules since M2: `expo-clipboard`, `expo-sharing`, `expo-file-system` → **rebuild the
dev client** (`npx expo run:ios`) before testing; a plain Metro reload is not enough.

## Tests

- Mobile: Vitest 25 (adapters, auto-lock, install layout…) + Jest 35 (UI: ui, mood-safety, today,
  vent, vault, mood, help, settings). `npm test` in `mobile/`.
- Web: unchanged, 164 passing. Core dictionaries gained `vent.privacyCover`, `vault.unavailable`,
  `vault.retry` (vi + en).

## Owner checklist (iOS simulator)

From `mobile/`: `npx expo run:ios` (first time after this branch), later `npx expo start --clear`.

1. First launch → welcome sheet → **Got it**. Relaunch: it does not come back.
2. Today → tap **Heavy** → "Saved for today" → **Add tags or a note** → pick Work, type a note →
   **Save details** → "Details saved".
3. Today → **Write about this** → Vent opens with the prompt, no tab bar. Type a few lines →
   **Release into the void** → words drift up and burn out (soft haptic) → "Let go." → **Write again**
   shows an empty page. Shake/undo does not bring the text back.
4. Vent → type `I want to die` → Release → gentle card appears → **Call a support line** opens Help.
   Back, release again with the same words → no card the second time (once per session).
5. Vent → type something → swipe up to the app switcher → the page shows only "MindCocoon".
6. Vent → **Save to vault** → title → Save → "Saved to your vault". Vault tab → entry is listed →
   open, edit, save; delete asks first.
7. Vault → **Vault settings** → Set a passcode (twice) → recovery card with 12 numbered words →
   Done stays disabled until "I've saved my recovery code" is ticked. **Copy** works.
8. **Lock now** → wrong passcode shows an error → right one opens. **Forgot passcode?** → paste the
   recovery code → Continue → new passcode → entries are back.
9. Settings sheet → auto-lock **1 min** → send the app to the background for over a minute → back:
   the vault is locked.
10. Mood tab → check in with a note → week strip and month map turn the mood colour → tap today's
    cell → note is shown. Previous month works; next month is disabled. History delete asks first.
11. Settings → **Support lines** (or Help) → **Call** opens the dialer prompt (simulator may show
    nothing — try on a phone). Airplane mode: Help still works.
12. Settings → **Download a copy** → share sheet → save to Files → the JSON has `v1.` envelopes, no
    readable journal text.
13. Settings → **Erase everything** → button disabled until `erase` is typed → erase → back on Today,
    vault empty, welcome sheet shows again on next launch, language back to the device language.
14. Settings → switch to Tiếng Việt and Mist; repeat a couple of screens — all copy is translated.

## Known gaps

- Sanctuary tab is still a placeholder: breathing, ambient sound and tonight's music are **M4**
  (Vent's "Listen to the rain" lands there).
- Account, Sign in with Apple and encrypted backup on mobile: **M5**. AdMob, Pro, remote flags: **M6**.
- Hotline numbers and hours are unverified (launch checklist).
- Android not run.
