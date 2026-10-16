@AGENTS.md

# MindCocoon

A bilingual (vi/en), local-first, installable web app for late-night emotional decompression:
vent and release into the void, an encrypted private vault, a mood journey, breathing and
ambient sound. Optional 16+ login adds end-to-end-encrypted cloud backup.

- Product spec: `docs/superpowers/specs/2026-10-16-mindcocoon-design.md` (Vietnamese)
- Implementation plan: `docs/superpowers/plans/2026-10-16-mindcocoon-v1.md`
- Supabase setup: `docs/SUPABASE.md` · Launch checklist: `docs/LAUNCH_CHECKLIST.md`
- Talk to the project owner in Vietnamese; code, identifiers and commits stay in English.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Unit + component tests (Vitest, jsdom, fake-indexeddb) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright (Chromium desktop + iPhone WebKit); builds and starts the app |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (Next + React Compiler rules) |
| `npm run gen:audio` | Regenerate placeholder ambience/music into `public/audio` (needs ffmpeg) |

Crypto tests run in Node's WebCrypto: put `// @vitest-environment node` at the top of the file.
E2E specs import `test` from `tests/e2e/fixtures.ts` (skips the first-run dialog) and wait for
`networkidle` before typing (typing before hydration leaves React state empty).

## Architecture

- Next.js 16 App Router with a `[lang]` root segment; `proxy.ts` picks `vi`/`en`.
  `cacheComponents` is on, so hidden routes stay mounted inside `<Activity>`:
  effects clean up on hide and re-run on show — design state resets accordingly.
- Product UI is client components reading module-level external stores through
  `useSyncExternalStore` (`lib/vault/session.ts`, `lib/mood/store.ts`, `lib/audio/engine.ts`).
- Persistence goes through `lib/storage` (IndexedDB via idb-keyval; memory fallback).
- Private content is encrypted on-device: one random data key (DEK) wrapped by
  device / passcode / recovery-code / server-secret keys (`lib/vault/keyring.ts`).
  The `server` and device wraps never leave the device.
- Supabase (client-side `supabase-js` only) handles auth, encrypted backup blobs and
  anonymous open counts. Without env vars every Supabase feature degrades to local-only.

## Rules

- Read the matching guide in `node_modules/next/dist/docs/` before writing Next.js code.
- All user-visible strings live in `lib/i18n/dictionaries/{vi,en}.ts` with identical keys.
  Sentence case; no ALL-CAPS labels.
- No streaks, badges, counters, percentages or scores in the UI.
- Text released into the void is never stored, logged, tracked or sent anywhere.
- Journal titles/bodies and mood notes are stored and sent only as `v1.<iv>.<ciphertext>`.
- Analytics events carry only a random device id, an hour bucket and the locale.
- Ads never render on vent, vault, breathing, after-release or help; ads are off by default.
- Every animation respects `prefers-reduced-motion`.
- Palette: `#0F172A` slate, `#F1F5F9` mist, `#7FB5A8` sage-teal, `#D9A86C` ember.
  Fonts: Newsreader (serif) + Hanken Grotesk, both with the `vietnamese` subset.
- Login only after confirming age ≥ 16; nothing requires login.
- TDD: write the failing test first, watch it fail, then implement.
- Commits: Conventional Commits, ending with the Co-Authored-By trailer.
- Supabase work: load `.claude/skills/supabase` and `.claude/skills/supabase-postgres-best-practices` first.
