# M2 app skeleton — report

Branch `feat/mobile-m2` (on top of `feat/mobile-m1`). iOS only; Android not run (owner's call).

## What exists

- Expo Router with a hoisting-safe entry: `index.ts` → `src/polyfills` (crypto) → `src/bootstrap`
  (SQLite storage into core) → `expo-router/entry`.
- Storage: `expo-sqlite/kv-store` (JSON, `mc:` namespace) + device key in `expo-secure-store`
  (`AFTER_FIRST_UNLOCK`). A missing device key leaves the vault **locked** (recover with the
  12-word code) — never a fresh empty vault over existing entries.
- Language: saved choice → device language (vi/en) → English. Theme: Dusk (default) / Mist, colours
  identical to the web (a test parses `app/globals.css`). Fonts: Newsreader + Hanken Grotesk.
- Five tabs (Today, Vent, Mood, Sanctuary, Vault) with placeholder content, Settings (language,
  appearance, disclaimer) from the header, dev-only `/dev/spike` (crypto spike + persistence panel).

## Automated checks

| Check | Result |
|---|---|
| `cd mobile && npm test` (entry order, storage/vault restore, locale, token parity) | 19/19 |
| `cd mobile && npm run typecheck && npx expo lint` | clean |
| `npx expo-doctor` | 20/20 |
| Web: `npm test` / `npm run typecheck` | 162/162 / clean |
| Metro serves `/mobile/index.ts.bundle?platform=ios` | 200, router env inlined |

## Owner's simulator check (run from `mobile/`: `npx expo run:ios`)

1. App opens on **Hôm nay** (Vietnamese, dark Dusk), five tabs at the bottom, settings icon top right.
2. Today → "Dev: crypto spike" → all eight checks ✓, **ALL PASS**, then the Persistence line shows
   `vault: unlocked`. Tap **Add test entry** once or twice; note the entry count.
3. Settings → **English** and **Mist**: the whole app switches immediately.
4. Fully close the app (swipe up) and reopen it: still English + Mist; Persistence shows the same
   entry count and `vault: unlocked`.

## Open items

- Re-measure PBKDF2 (310 000 iterations) on a physical iPhone (simulator: 32–44 ms).
- Android not run yet.
