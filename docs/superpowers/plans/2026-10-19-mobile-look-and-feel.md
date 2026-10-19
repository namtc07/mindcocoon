# Mobile — Look and feel (learn from Calm, How We Feel, Finch) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

> **Tóm tắt (VI):** Chủ dự án muốn app "giống/clone" các app tham khảo. [Claude quyết] Học **mẫu thiết kế** (pattern), không sao chép icon, tên, hình, âm thanh, câu chữ của họ — Apple từ chối app nhái (Guideline 4.1) và có rủi ro bản quyền. Đợt này: icon + màn khởi động riêng, cảnh vẽ bằng SVG (bầu trời theo giờ, cảnh cho từng mix — kiểu Calm), linh vật "Kén" (kiểu Finch nhưng không cho ăn, không chuỗi ngày), chọn cảm xúc dạng bản đồ năng lượng × dễ chịu với nhiều từ hơn (kiểu How We Feel), thẻ mix có tranh (kiểu BetterSleep), màn chào cá nhân hoá (kiểu Calm/Finch). Không cần thư viện native mới (react-native-svg đã có).

**Goal:** The app looks and feels as warm and visual as the reference apps while keeping its own identity and rules.

**Architecture:** All illustration is code-drawn SVG (`react-native-svg`) from small deterministic components in `mobile/src/components/art/`; no bitmap assets except the generated app icon/splash (rendered from the same SVG with `sharp` by `scripts/generate-brand.mjs`). Data (feeling words, mood-meter positions, onboarding intents) lives in `@mindcocoon/core`.

**Tech Stack:** existing; `sharp` (already in root node_modules) for icon rasterisation.

**Spec:** owner request 2026-10-19 ("cải thiện giống với app kia, có thể nói là clone lại") + Claude's comparison (priorities 2 and 3; 1 and 4 need licensed audio / recorded voice → owner). Rules: `CLAUDE.md`.

## Global Constraints

- No copying of reference apps' names, logos, illustrations, sounds or copy.
- No streaks, counters, scores, levels, pets to feed. The mascot never asks for anything.
- Every animation respects Reduce Motion (static frame); illustrations are decorative (`accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"`) and never carry meaning alone.
- Palette stays: slate `#0F172A`, mist `#F1F5F9`, sage-teal `#7FB5A8`, ember `#D9A86C` + mood colours.
- en/vi parity, natural Vietnamese; existing accessible names (radio labels, chip names) keep working.
- Stored feeling ids stay valid (only additions).
- Gates per task: mobile `npm run typecheck && npx expo lint && npm test`, root `npm test`; commit inside `if` on both.

## Review Focus

1. Mood meter: every mood still selectable by screen reader with the same label; changing mood drops foreign feeling words.
2. Onboarding: shown once; never over Help; the disclaimer is still shown; skipping works; existing users (firstRunSeen) never see it.
3. Scenes: no re-render storm (twinkle runs on UI thread), static when Reduce Motion.
4. Icon/splash generation is reproducible and app.json points at the generated files.
5. Feeling words: old ids still render; 3-word cap kept.

---

### Task 1: Brand mark, app icon and splash
Files: `mobile/src/components/art/CocoonMark.tsx` (SVG: soft oval cocoon in sage-teal→ember gradient, wrapped by two thin silk lines, a tiny moon), `scripts/generate-brand.mjs` (same paths as an SVG string → `sharp` → `mobile/assets/icon.png` 1024 opaque slate bg, `splash-icon.png` 1024 transparent, `android-icon-foreground.png` 1024 transparent with safe-zone padding, `android-icon-background.png` slate, `android-icon-monochrome.png` white mark, `favicon.png` 48), `npm run gen:brand` at root.
Tests: `mobile/__tests__/brand.test.ts` — icon files are 1024×1024 PNGs and differ from Expo's default (md5 `cb975bba…`); `CocoonMark` renders hidden from accessibility.
Commit `feat(mobile): own app icon and splash`.

### Task 2: Sky and scenes
Files: `src/components/art/Sky.tsx` (`<Sky part="morning|afternoon|evening|night" height />`: gradient sky, sun/moon, seeded stars at night, two hill layers; ≤ 6 stars twinkle via Reanimated, static under Reduce Motion), `src/components/art/Scene.tsx` (`<Scene kind="rain|fire|sea|rain-sea|night|forest" />` — night sky base + motif: rain streaks, campfire glow, waves), `src/components/art/seeded.ts` (deterministic PRNG).
Today: a rounded sky banner (height 120) behind the greeting, part of day from `partOfDay(now)`.
Tests: `art.test.tsx` — `seeded stars are the same each render`, `Sky shows stars only at night`, `no animation under Reduce Motion`, `Today shows the sky for the part of day`.
Commit `feat(mobile): skies and scenes`.

### Task 3: Kén, a quiet companion
Files: `src/components/art/Ken.tsx` (`<Ken mood="calm|sleepy|listening|glad" size />` — a round cocoon creature with face; sleepy = closed eyes + "z"; gentle 3 s float unless Reduce Motion). Placements: Today next to the greeting (sleepy at night, calm by day), Vent empty editor (listening), after release (glad), wind-down "Sleep well" (sleepy), empty states: vault, mood history, worries.
Tests: `ken.test.tsx` — `Today shows a sleepy Kén at night`, `after release shows glad Kén`, `empty vault shows Kén`, `Kén is hidden from screen readers`.
Commit `feat(mobile): Kén, a quiet companion`.

### Task 4: Mood meter and more feeling words
Core: `FEELINGS` grows to 8 per mood (add — peaceful: `at-ease`, `cozy`, `balanced`; hopeful: `inspired`, `playful`, `confident`; numb: `distant`, `drained`, `meh`; heavy: `grieving`, `ashamed`, `homesick`; anxious: `tense`, `panicky`, `jealous`), `MOOD_METER: Record<MoodType, { energy: -1|0|1; pleasant: -1|0|1 }>` (anxious −1/+1 top-left, hopeful +1/+1 top-right, heavy −1/−1 bottom-left, peaceful +1/−1 bottom-right, numb 0/0 centre). Dictionaries en/vi.
Mobile: `MoodPicker` `variant="meter"` (default on Today quick check-in, wind-down and full form): 2×2 + centre layout of large gradient orbs (radial SVG gradient of the mood colour), axis hints "More energy / Less energy", "Unpleasant / Pleasant"; `variant="row"` keeps the old compact row for small places. `FeelingChips` tiles tinted with the mood colour (selected = filled).
Tests: core `every mood has eight words with labels`, `meter positions are unique`; Jest `the meter keeps radio names and selection`, `feeling tiles are tinted and still capped at three`.
Commit `feat: a mood meter and more feeling words`.

### Task 5: Mix cards with pictures
Files: `MixChips` → presets shown as 132×96 picture cards (`Scene` per preset: rainy-night→rain, by-the-fire→fire, sea-breeze→sea, rain-at-sea→rain-sea) with the name under the picture; selected = ember ring; saved mixes and "Save this mix" stay chips. Wind-down step 3 uses the same cards; "Sleep well" screen shows the chosen preset's scene full width.
Tests: `mix cards show a picture per preset and keep their names`, `selected card is marked`, existing mix tests stay green.
Commit `feat(mobile): mix cards with pictures`.

### Task 6: Welcome and personalisation
Core: `ONBOARDING_INTENTS = ["sleep","worries","feelings","write"] as const`.
Mobile: `src/components/onboarding/Welcome.tsx` replaces `FirstRunNotice` (full-screen modal, 3 steps, Back/Skip): 1) Kén + "A quiet place for heavy nights" + disclaimer; 2) "What brings you here?" multi-select intents (pref `intents`); 3) "What should we call you?" optional name (pref `name`, ≤ 24 chars, trimmed) + "Remind me in the evening" (sets reminder 22 via existing reminder lib) → "Begin". Shown only when `firstRunSeen` is not set; never over /help.
Use: greeting `"{greeting}, {name}"` when a name exists; Today order puts `entries` (wind-down) first at night when `sleep` was chosen and the worry line first when `worries` was chosen. Settings: "Your name" field.
Tests: `welcome shows once and finishes`, `skip still marks seen`, `the disclaimer is shown`, `the name appears in the greeting`, `sleep intent puts wind-down first at night`, `existing users never see it`, `not over help`.
Commit `feat(mobile): a welcome that fits you`.

### Task 7: Report
`docs/mobile/look-and-feel-report.md` (what changed, how to try it, owner: real audio + voice later). Commit.
