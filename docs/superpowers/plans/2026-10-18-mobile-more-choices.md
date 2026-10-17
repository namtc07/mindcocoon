# Mobile — More choices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Tóm tắt (VI):** Chủ dự án thấy app "tẻ nhạt, ít lựa chọn" và giao cho Claude tự quyết (bỏ qua phần hỏi). Giai đoạn này thêm lựa chọn ở đúng con đường chính *trút → nhẹ lòng → ngủ*: nhiều kiểu thở + độ dài, bộ âm pha sẵn + lưu bộ âm của mình, nhiều cách buông chữ, các bài tập nhẹ nhàng (5-4-3-2-1, quét cơ thể, ba điều tốt, thư gửi chính mình), thư viện câu gợi mở. Không streak, không điểm, không quảng cáo ở các màn mới.

**Goal:** Give people real choices at each step of the night-time path without adding pressure, counters or ads to calm moments.

**Architecture:** Content and timing maths live in `@mindcocoon/core` (bilingual, platform-free, Vitest); mobile screens consume them. New prefs remember each person's last choice (breathing pattern/length, release ritual, saved mixes). Practices are new stack routes under `src/app/practices/`.

**Tech Stack:** existing — Expo SDK 58, expo-router, Reanimated 4, react-native-svg, core dictionaries; no new native modules (no rebuild needed).

**Spec:** owner request 2026-10-18 ("app quá tẻ nhạt, không có nhiều lựa chọn cho user" → "bỏ qua phần hỏi, tự làm luôn"); product rules from `docs/superpowers/specs/2026-10-16-mindcocoon-design.md` (§2 anti-goals, §4.2 vent, §4.5 sanctuary, §8 safety) and `docs/superpowers/specs/2026-10-17-mindcocoon-mobile-design.md`. All feature choices below are **[Claude quyết]**.

## Global Constraints

- No streaks, badges, counters, percentages or scores (step navigation like "2 / 5" is not allowed either — use quiet dots).
- Ad-free: practices, prompt library and the release ritual picker are ad-free zones (add them to the forbidden-screen test).
- Released text is never stored; practice text is stored only if the person taps "Keep in my vault" (encrypted via `saveVaultEntry`), otherwise discarded.
- Strings only in core dictionaries/content with en + vi in step (parity tests); Vietnamese written naturally, not translated word-for-word.
- Reduce Motion respected (every new animation has a calm fallback). 44 pt targets, roles and labels.
- Web stays green: core changes are additive (`breathAt`, `TOTAL_MS` keep their meaning).
- Gate per task from `mobile/`: `npm run typecheck && npx expo lint && npm test`; root `npm test` for core changes. Commit per task with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Practice text leaking**: text typed in a practice must not survive leaving the screen, the app being backgrounded/killed, or "Let it go" → Task 4 tests.
2. **Breathing timing across patterns/lengths**: phase boundaries and the end for 4-7-8 (19 s cycles) and 1/3/5 min lengths; leaving mid-way still stops/releases keep-awake → Task 1 tests.
3. **Applying a mix while sounds are playing / held / a sleep timer runs**: sounds outside the mix stop, the timer is kept, locked premium sounds are never started → Task 2 tests.
4. **Ritual picker + Reduce Motion + very long text**: every ritual finishes and clears the text; Reduce Motion always uses the short fade → Task 3 tests.
5. **Prompt library → Vent**: the chosen prompt shows above the editor and survives a language switch by index → Task 5 tests.

---

### Task 1: Breathing patterns and lengths

**Files:** Modify `packages/core/src/breathing.ts` (+ `packages/core/test/breathing.test.ts`), `mobile/src/lib/breath-geometry.ts`, `mobile/src/components/sanctuary/BoxBreathing.tsx` (rename export kept; becomes the pattern-aware exercise), `mobile/src/lib/prefs.ts` (`breathing?: { pattern: BreathPatternId; minutes: 1 | 3 | 5 }`), dictionaries; tests in `mobile/test/breath-geometry.test.ts`, `mobile/__tests__/sanctuary.test.tsx`.

**Interfaces — Produces (core):**
```ts
export type BreathPatternId = "box" | "relax" | "calm";
export interface BreathPattern { id: BreathPatternId; phases: { phase: BreathPhase; ms: number }[] }
export const BREATH_PATTERNS: Record<BreathPatternId, BreathPattern>;
// box: in 4 / hold 4 / out 4 / hold 4 · relax (4-7-8): in 4 / hold 7 / out 8 · calm: in 4 / out 6
export function cyclesFor(pattern: BreathPattern, minutes: number): number; // max(1, round(minutes*60000 / cycleMs))
export function totalMsFor(pattern: BreathPattern, cycles: number): number;
export function breathAtPattern(pattern: BreathPattern, cycles: number, elapsedMs: number): BreathState & { phaseMs: number };
```
`breathAt(ms)` stays equal to `breathAtPattern(BREATH_PATTERNS.box, 4, ms)` minus `phaseMs` (existing tests unchanged). `secondsLeft` becomes `number` (1…phase seconds).

Mobile: chips under the title — pattern ("Box" / "4-7-8" / "Slow exhale"; vi "Thở hộp" / "4-7-8" / "Thở ra chậm") and length (1 / 3 / 5 min) — both remembered in prefs, disabled while running. Drawing: box pattern keeps the square + travelling dot; the others show the same inner shape growing on inhale, held, shrinking on exhale (no dot). Worklet gets the phase list as a plain array: `breathAtPatternWorklet(phases, elapsedMs)` → `{ phaseIndex, progress }` (phase looked up from the array); `breathScale(phase, progress)` replaces `innerScale` for every pattern. Keep-awake, stop on blur/background, VoiceOver announcements unchanged. Pattern hint line under the chips (`t.sanctuary.patternHint.<id>`).

- [ ] Step 1: failing tests — core: `4-7-8 phases fall on 4 s, 11 s and 19 s`, `calm has no holds`, `cyclesFor rounds to whole cycles and never below 1` (box 1 min → 4, 4-7-8 3 min → 9, calm 5 min → 30), `breathAt still matches the old box timing`; mobile Vitest: `breathAtPatternWorklet agrees with core for 4-7-8`, `breathScale grows on inhale, holds, shrinks on exhale`; Jest: `choosing 4-7-8 shows Hold for 7 seconds after Breathe in`, `the chosen pattern and length are remembered`, `choices are locked while breathing`, `a 3-minute box session ends after 3 minutes, not 1`.
- [ ] Step 2: run → FAIL. Step 3: implement. Step 4: PASS + mobile gate + root `npm test`.
- [ ] Step 5: commit `feat: breathing patterns (4-7-8, slow exhale) and session lengths`.

### Task 2: Sound presets and saved mixes

**Files:** Create `packages/core/src/audio/mixes.ts` (+ test); modify `mobile/src/lib/audio/engine.ts` (`applyMix`), `mobile/test/audio-engine.test.ts`, `mobile/src/components/sanctuary/{SoundMixer,MixChips}.tsx`, prefs (`mixes?: SavedMix[]`), dictionaries; Jest in `__tests__/sanctuary.test.tsx`.

**Interfaces:**
```ts
// core
export interface Mix { volumes: Record<string, number> } // ids with volume > 0 are in the mix
export const PRESET_MIXES: { id: "rainy-night" | "by-the-fire" | "sea-breeze" | "deep-forest-rain"; mix: Mix }[];
// rainy-night: rain .7, night-wind .3 · by-the-fire: campfire .7, rain .25 · sea-breeze: ocean .7, night-wind .35 · deep-forest-rain: rain .5, ocean .2, night-wind .2
export interface SavedMix { id: string; name: string; mix: Mix; createdAt: string }
export const MAX_SAVED_MIXES = 5;
// engine
applyMix(mix: Mix, playable: (id: string) => boolean): Promise<void>; // pauses sounds not in the mix, sets volumes, plays the rest; keeps the sleep timer; skips ids that aren't playable
```
UI: a horizontal row of chips above the sound list: presets (names from dictionary `t.sanctuary.presets.<id>`), then saved mixes ("My mix 1"… auto-named `t.sanctuary.myMix` with the next free number), then "Save this mix" (only when something is playing; disabled at 5 with hint "You can keep up to 5 mixes — remove one first."). Saved chips have a remove button (label "Remove {name}"). The chip of a mix that matches what's playing is selected. Playable = free sounds + currently unlocked premium sounds.

- [ ] Step 1: failing tests — engine: `applyMix stops sounds outside the mix and sets volumes`, `applyMix keeps the sleep timer`, `applyMix skips sounds that aren't playable`; Jest: `a preset starts its sounds`, `saving the current mix adds "My mix 1"`, `a sixth mix can't be saved`, `removing a saved mix`, `a saved mix with a now-locked premium sound plays the rest`.
- [ ] Steps 2–4: FAIL → implement → PASS + gates. Step 5: commit `feat(mobile): sound presets and saved mixes`.

### Task 3: Release rituals

**Files:** Modify `mobile/src/components/vent/Dissolve.tsx` (`planDissolve(text, ritual, random)` + ritual-specific motion), `mobile/src/app/(tabs)/vent.tsx` (ritual picker), prefs (`ritual?: Ritual`), dictionaries; tests in `__tests__/vent.test.tsx`.

**Interfaces:** `export type Ritual = "burn" | "float" | "scatter" | "fade";` — burn = today's embers (default); float = words drift slowly down-right and sink like paper on water, soft blue-grey tint (`c.primary`), ~3 s; scatter = words blown far left/right with rotation, no embers, ~2 s; fade = whole text sinks a few px and fades into the background, ~2.5 s. Reduce Motion → 600 ms fade for every ritual. Picker: a row of 4 chips under the editor labelled `t.vent.ritualLabel` ("How to let go" / "Buông theo cách"), names `t.vent.rituals.<id>` (Burn / Float away / Scatter in the wind / Fade into the night; vi: Đốt / Thả trôi / Gió cuốn / Tan vào đêm); the release button text stays "Release into the void". Remembered in prefs.

- [ ] Step 1: failing tests — `planDissolve float/scatter/fade produce no embers and the ritual's motion` (direction signs per ritual), Jest `each ritual releases and clears the text` (each, fake timers), `the chosen ritual is remembered`, `Reduce Motion uses the short fade for every ritual`.
- [ ] Steps 2–4. Step 5: commit `feat(mobile): choose how to let go (burn, float, scatter, fade)`.

### Task 4: Gentle practices

**Files:** Create `packages/core/src/practices.ts` (+ test), `mobile/src/app/practices/index.tsx`, `mobile/src/app/practices/[id].tsx`, `mobile/src/components/practices/{PracticeList,PracticeRunner}.tsx`, `__tests__/practices.test.tsx`; modify root `_layout.tsx` (stack screens), Sanctuary (section "Gentle practices" with the list), `EntryLinks` (fourth entry "Gentle practices"), `__tests__/ads.test.tsx` (forbidden list + practices).

**Interfaces (core):**
```ts
export type PracticeId = "grounding" | "body-scan" | "three-good-things" | "kind-letter";
export interface PracticeStep { text: string; seconds?: number; input?: "line" | "letter" }
export interface Practice { id: PracticeId; title: string; summary: string; minutes: number; steps: PracticeStep[] }
export function getPractices(locale: Locale): Practice[]; // en + vi, same ids/step counts (test)
```
Content: grounding (5 steps: 5 things you see / 4 you can touch / 3 you hear / 2 you smell / 1 you taste, each ~20 s, then a closing line); body scan (6 steps × ~30 s: feet, legs, belly, chest, shoulders, face); three good things (3 `line` inputs + intro/outro); kind letter (intro + one `letter` input "Write to yourself as you would to a friend who feels this way" + outro).

Runner: one step at a time, large serif text, Back / Next (last: "Finish"), quiet progress dots (no numbers); optional gentle countdown ring for `seconds` steps (Reduce Motion → static text, no auto-advance anywhere); inputs use `TextField` with `autoCorrect={false}`, `spellCheck={false}`. Finish screen for practices with inputs: "Keep in my vault" (encrypted entry, title = practice title, body = the answers joined; asks for passcode inline if locked — reuse `SaveSheet` logic) or "Let it go" (discard). Leaving the screen or backgrounding the app clears typed text (state reset on blur / AppState background, like Vent's privacy cover). Keep-awake while a timed step runs.

- [ ] Step 1: failing tests — core `every practice has the same steps in en and vi`, `three good things asks three times`; Jest `the list shows four practices with their minutes`, `grounding walks through five steps and finishes`, `three good things kept in the vault is encrypted`, `let it go stores nothing`, `leaving the practice clears what was typed`, `no ads on practices`.
- [ ] Steps 2–4. Step 5: commit `feat(mobile): gentle practices (grounding, body scan, three good things, kind letter)`.

### Task 5: Prompt library

**Files:** Create `mobile/src/app/prompts.tsx`, `__tests__/prompts.test.tsx`; modify `packages/core/src/prompts.ts` (`promptAt(locale, index)` + `PROMPT_COUNT`), `mobile/src/app/(tabs)/vent.tsx` (accept `promptIndex` param), `mobile/src/components/today/ReflectionPrompt.tsx` ("More prompts" link), root `_layout.tsx`, dictionaries.

Screen: the full list for the current language, a "Surprise me" button (random prompt highlighted + scroll), each row pressable → `router.push({ pathname: "/vent", params: { promptIndex: i } })`. Vent shows `promptAt(locale, promptIndex)` (so switching language keeps the same prompt).

- [ ] Step 1: failing tests — core `promptAt wraps and matches the lists`; Jest `the library lists every prompt`, `picking one opens Vent with it`, `Vent shows the same prompt after switching to Vietnamese`, `no ads on the prompt library`.
- [ ] Steps 2–4. Step 5: commit `feat(mobile): prompt library`.

### Task 6: Report

**Files:** `docs/mobile/more-choices-report.md` — what's new, device checklist (each pattern's timing feels right; mixes; each ritual on device incl. Reduce Motion; practices end-to-end, app switcher hides practice text; prompt library), no rebuild needed (JS only). Full gates; commit `docs(mobile): more-choices report`.
