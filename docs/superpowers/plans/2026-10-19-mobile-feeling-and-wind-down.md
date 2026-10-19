# Mobile — Feelings, suggestions, wind-down and release sounds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Tóm tắt (VI):** Sau khi tham khảo How We Feel, Stoic/Calm Sleep và UNHEAVY, chủ dự án đồng ý làm cụm 1+2+3+4: (1) gợi ý sau check-in, (2) thói quen trước giờ ngủ một chạm, (3) âm thanh + rung khi buông chữ, (4) từ chỉ cảm xúc chi tiết. Không cần thư viện native mới.

**Goal:** Make the night-time path feel personal and continuous: name the feeling more precisely, get a matching suggestion, wind down in one flow, and feel the release.

**Architecture:** Feeling words and mood→suggestion mapping live in `@mindcocoon/core` (bilingual, tested). `MoodLog` gains an optional `feelings` field (additive; web/backup unaffected). Mobile adds a `/wind-down` stack route reusing BoxBreathing, MixChips logic and the sleep timer; release sounds are short generated clips played with a one-shot expo-audio player.

**Tech Stack:** existing (Expo SDK 58, expo-audio, expo-haptics, Reanimated); ffmpeg for placeholder sound effects (like the existing generated ambience).

**Spec:** owner approval 2026-10-19 ("ok làm đi") of Claude's recommendation list (items 1–4); product rules in `CLAUDE.md` and `docs/superpowers/specs/2026-10-16-mindcocoon-design.md`. Choices below are **[Claude quyết]**.

## Global Constraints

- No streaks, scores, counters; suggestions are offers, never instructions ("Something for this feeling", skippable, no "you should").
- No ads in the wind-down flow, on suggestion targets that are already ad-free, or in Vent.
- Feeling words are stored like tags (plain, inside the device store and the encrypted backup); notes stay encrypted.
- Release sounds are quiet (volume 0.5), on by default, can be turned off in Settings, and are independent of Reduce Motion (sound follows its own setting).
- Strings en/vi in core with parity; natural Vietnamese.
- Gates per task: mobile `npm run typecheck && npx expo lint && npm test`; root `npm test` for core changes. Commit per task.

## Review Focus

1. **Feelings vs. changing the mood**: switching a check-in from Heavy to Anxious must drop feeling words that belong to Heavy.
2. **Suggestion actions**: "Breathe" opens Sanctuary at breathing with the suggested rhythm selected (not started); "Play" applies the mix (respecting playable); "Practice" opens it.
3. **Wind-down leaving midway**: back out at any step → nothing keeps playing that the person didn't start; breathing stops; a sleep timer is set only when they tap "Goodnight".
4. **Release sound**: plays exactly once per release (also with Reduce Motion), stops if the person leaves Vent; Settings toggle off → silent.
5. **Old check-ins without `feelings`** render and edit fine.

---

### Task 1: Core — feeling words, MoodLog.feelings, suggestions

**Files:** `packages/core/src/feelings.ts` (+ test), `packages/core/src/types.ts` (`feelings?: string[]`), `packages/core/src/mood/store.ts` (`addMood` / `updateMoodDetails` / `changeMood` accept/handle feelings), `packages/core/test/mood.test.ts`, dictionaries (`feelings.<id>` labels).

**Interfaces:**
```ts
export const FEELINGS: Record<MoodType, string[]>; // 5 ids per mood, e.g. heavy: ["exhausted","lonely","sad","hurt","disappointed"]
export const MAX_FEELINGS = 3;
export interface Suggestion { breath: { pattern: BreathPatternId; minutes: 1 | 3 }; mix: PresetMixId; practice: PracticeId }
export function suggestionFor(mood: MoodType): Suggestion;
// peaceful: box 1 / sea-breeze / three-good-things · hopeful: box 1 / by-the-fire / three-good-things
// numb: box 1 / by-the-fire / grounding · heavy: relax 3 / rainy-night / kind-letter · anxious: calm 3 / rain-at-sea / grounding
```
Words — peaceful: calm, content, relieved, grateful, safe · hopeful: excited, motivated, proud, loved, curious · numb: empty, tired, bored, disconnected, flat · heavy: exhausted, lonely, sad, hurt, disappointed · anxious: worried, overwhelmed, restless, scared, irritated. vi: bình thản, hài lòng, nhẹ nhõm, biết ơn, an toàn · háo hức, có động lực, tự hào, được thương, tò mò · trống trải, mệt mỏi, chán, lạc lõng, uể oải · kiệt sức, cô đơn, buồn, tổn thương, thất vọng · lo lắng, quá tải, bồn chồn, sợ hãi, bực bội.

Store: `addMood({ mood, tags, note?, feelings? })`, `updateMoodDetails(prev, { tags, note?, feelings? })` (omitted feelings keep the previous), `changeMood` drops feelings not in the new mood's list.

- [ ] Tests first: `every mood has five feeling words with en+vi labels`, `suggestionFor covers every mood with real presets/practices/patterns`, `addMood stores feelings`, `updateMoodDetails keeps feelings unless given`, `changeMood drops feelings of the old mood`, `old logs without feelings still load`. → implement → root `npm test` + mobile gate → commit `feat(core): feeling words and mood suggestions`.

### Task 2: Feeling words in check-ins

**Files:** `mobile/src/components/mood/FeelingChips.tsx`, `QuickCheckin.tsx` (details area), `CheckinForm.tsx`, `DayDetail.tsx` (show words), tests in `__tests__/today.test.tsx`, `__tests__/mood.test.tsx`.

UI: after a mood is chosen, a line "More precisely?" (`t.feelings.prompt`, vi "Cụ thể hơn?") with the five words as chips, up to 3 selected (extra taps ignored; selected chips show `selected`). Quick check-in: tapping a word saves immediately via `updateMoodDetails` (like the one-tap mood). Full form: saved with the form. Day detail lists the words.

- [ ] Tests first: `picking a feeling word after a quick check-in saves it`, `at most three words`, `changing the mood shows that mood's words and drops the old ones`, `the full form saves feelings`, `day detail shows the words`. → implement → gate → commit `feat(mobile): name the feeling more precisely`.

### Task 3: "Something for this feeling" after a check-in

**Files:** `mobile/src/components/today/SuggestionCard.tsx`, `mobile/src/lib/suggest-actions.ts`, Today screen, tests `__tests__/suggestions.test.tsx`.

Card under the quick check-in once today's mood exists (`t.suggest.title` "Something for this feeling" / "Một chút cho cảm xúc này"): three rows — breathe (`{pattern name} · {n} min`) → sets prefs `breathing` to the suggestion and `router.push({ pathname: "/sanctuary", params: { section: "breathe" } })`; mix (`{preset name}`) → `audio.applyMix(preset.mix, playable)` and a toast "Playing {name}"; practice (`{title}`) → `/practices/[id]`. A "Not now" link hides it for today (prefs `suggestHiddenOn: dayKey`).

- [ ] Tests first: `anxious shows slow exhale, Rain at sea and grounding`, `breathe opens Sanctuary with that rhythm selected`, `play starts the mix`, `practice opens it`, `not now hides it until tomorrow`, `no card before checking in`. → implement → gate → commit `feat(mobile): suggestions after a check-in`.

### Task 4: Wind down (bedtime routine in one flow)

**Files:** `mobile/src/app/wind-down.tsx`, `mobile/src/components/wind-down/*`, Today entry (first tile "Wind down for sleep" / "Thư giãn trước khi ngủ"), Sanctuary button, `__tests__/wind-down.test.tsx`, ads forbidden list.

Flow (one screen, steps with Back/Skip): 1) "How are you tonight?" MoodPicker (saves a check-in like Today; skippable; if today already has one, it's preselected and not duplicated) → 2) breathing with the suggestion's rhythm (1 min, `BoxBreathing` with an override prop, Skip) → 3) "Sounds for sleep": the suggested preset preselected (chips of presets), sleep timer chips 20/30/60 (default 30) → "Goodnight" applies the mix + sleep timer and shows a dim "Sleep well" screen with the mini-player state; Back from step 3 or leaving stops nothing that wasn't started by the flow, and the flow never starts sound before "Goodnight".

- [ ] Tests first: `the whole flow saves the check-in, then Goodnight plays the mix with a 30-minute timer`, `skipping the check-in uses Rainy night`, `an existing check-in today isn't duplicated`, `leaving before Goodnight plays nothing`, `no ads in wind-down`. → implement → gate → commit `feat(mobile): wind down for sleep in one flow`.

### Task 5: Release sounds and haptics

**Files:** `scripts/generate-sfx.mjs` (ffmpeg; outputs `mobile/assets/audio/sfx/{burn,float,scatter,fade}.m4a`, 2–4 s, quiet, fade in/out), `mobile/src/lib/release-sound.ts`, `Dissolve.tsx` (play on start; ritual-specific haptic pattern at start and end), Settings toggle (`t.settings.releaseSound` "Sound when letting go" / "Âm thanh khi buông"; prefs `releaseSound?: boolean`, default on), tests in `__tests__/vent.test.tsx` + `__tests__/settings.test.tsx`.

`playReleaseSound(ritual)` creates a one-shot player (`createAudioPlayer(source)`, volume 0.5), plays, removes it on finish or after 6 s; only if the setting is on. Haptics: burn — light impacts ×3; float — one soft; scatter — two quick; fade — none until the end success.

- [ ] Tests first: `releasing plays that ritual's sound once`, `the setting turns release sounds off`, `leaving Vent mid-release stops the sound`. → implement (run the generator; commit the files) → gate → commit `feat(mobile): sound and touch when letting go`.

### Task 6: Report

`docs/mobile/feelings-wind-down-report.md` (what's new, checklist). Full gates; commit.
