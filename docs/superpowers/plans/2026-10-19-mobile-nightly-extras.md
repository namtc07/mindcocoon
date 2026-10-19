# Mobile — Nightly extras Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Tóm tắt (VI):** Chủ dự án chọn các mục 1, 3, 6, 7, 8, 9, 10, 11, 12, 13. Làm: hộp lo âu, nhắc nhở mở thẳng "Thư giãn trước khi ngủ", 3 bài tập mới, câu gợi mở theo chủ đề, nhận xét nhẹ nhàng (chỉ chữ), cả năm thành ô màu, ảnh hành trình tháng (riêng tư), giao diện dịu sau 22h, thở có chuông + rung. **Widget (13) hoãn [Claude quyết]**: `expo-widgets` (SDK 58) bắt buộc App Group, Apple ID miễn phí không ký được → sẽ làm khi có tài khoản Apple Developer.

**Goal:** More reasons to come back each night and more ways to feel understood, without pressure, counters or ads in calm moments.

**Architecture:** Content and pure logic in `@mindcocoon/core` (practices, prompt themes, insights, year grid); mobile screens consume them. Worries are stored encrypted (`v1.` via the vault's `encryptField`) in their own KV list. One native addition: `react-native-view-shot` (journey image) → dev-client rebuild.

**Tech Stack:** existing + `react-native-view-shot` (via `npx expo install`), expo-sharing, expo-notifications (response listener), expo-haptics, expo-audio one-shots.

**Spec:** owner's selection 2026-10-19 from Claude's list; rules in `CLAUDE.md` and `docs/superpowers/specs/2026-10-16-mindcocoon-design.md`. Choices below are **[Claude quyết]**.

## Global Constraints

- No streaks, scores, counts or percentages in UI (insights are words only, e.g. "often", "lately"; no "3 worries").
- Private text (worries) only as `v1.` envelopes; the journey image contains colours and feeling words, no notes, and is shared only when the person taps Share.
- Ads: new standalone screens (worry box) are ad-free; the Mood tab keeps its single end-of-page banner, below the new insights/year sections.
- Safety: writing a worry goes through `checkText` + gentle card like Vent.
- Reduce Motion respected; 44 pt; en/vi parity; natural Vietnamese.
- Gates per task; commit per task; branch `feat/mobile-nightly-extras` (on top of `feat/mobile-feelings-wind-down`).

## Review Focus

1. Worries: plaintext never stored; opening a worry while the vault is passcode-locked asks for the passcode; erase everything removes worries.
2. Notification tap (cold start and running) opens wind-down exactly once.
3. Insights never claim a pattern from too little data (thresholds) and contain no digits.
4. Night dim switches at 22:00 / 06:00 without re-rendering the whole app every few seconds.
5. Breathing cues: one cue per phase change, none after stop/finish or when turned off.

---

### Task 1: Worry box
Files: `mobile/src/lib/worries.ts` (KV `worries:v1`: `{ id, text: v1-envelope, createdAt, openAt }[]`; `addWorry(text, now)` → openAt = next 06:00 local; `readyWorries(now)`, `openWorry(id)` → plaintext (needs unlocked vault), `removeWorry(id)`, `keepAnotherDay(id, now)`, `clearWorries()`), Vent third action "Set it down until tomorrow" / "Để mai tính" (through `attempt()` safety flow; clears editor; toast "In the worry box until morning."), `src/app/worries.tsx` (ready worries: read → "Still heavy?" → Let it go / Keep in vault / Another day; waiting ones listed only as "Waiting until morning" without text), Today gentle line when one is ready ("Something you set down last night is ready" → /worries), erase clears worries.
Tests: `a worry is stored encrypted and waits until morning`, `ready worries can be let go, kept in the vault, or kept another day`, `heavy words get the gentle card`, `locked vault asks for the passcode to open`, `erase everything removes worries`, `Today shows the line only when one is ready`.
Commit `feat(mobile): worry box`.

### Task 2: Reminder opens wind-down
Files: `src/lib/reminder.ts` (content `data: { url: "/wind-down" }`), `src/components/settings/NotificationRouter.tsx` in root layout (`Notifications.useLastNotificationResponse()` + `addNotificationResponseReceivedListener` → `router.push(url)` once per response id).
Tests: `the reminder carries the wind-down link`, `tapping it opens wind-down once`.
Commit `feat(mobile): the evening reminder opens wind-down`.

### Task 3: Three more practices
Files: `packages/core/src/practices.ts` (+ tests): `unsent-letter` (letter input to someone; outro "You don't have to send it."), `safe-place` (5 timed visualisation steps), `muscle-release` (6 timed tense-and-release steps). en/vi.
Tests: core parity (existing test covers), Jest list shows seven.
Commit `feat: three more gentle practices`.

### Task 4: Prompt themes
Files: `packages/core/src/prompts.ts` (`PROMPT_THEMES: PromptTheme[]` = heavy · relationships · study-work · kindness · hope · self; `PROMPT_THEME_OF: PromptTheme[]` one per index, same length as the lists), `src/app/prompts.tsx` (filter chips "All" + themes), dictionaries `prompts.themes.<id>`.
Tests: `every prompt has a theme`, Jest `filtering by Relationships shows only those prompts`.
Commit `feat(mobile): prompt themes`.

### Task 5: Gentle observations (insights)
Files: `packages/core/src/mood/insights.ts` (+ tests): `gentleInsights(logs, now): Insight[]` from the last 30 days, at most 3:
- `tag-mood` — a tag on ≥ 4 check-ins where one mood is ≥ 60 % of them → `{ kind: "tag-mood", tag, mood }`;
- `feeling-lately` — a feeling word picked on ≥ 3 check-ins in the last 7 days → `{ kind: "feeling-lately", word }`;
- `late-anxious` — ≥ 4 anxious/heavy check-ins and ≥ 70 % of them between 22:00–04:00 → `{ kind: "late-night", mood }`.
Rendered as sentences on the Mood tab (`t.insights.*` templates, no digits): "On days tagged {tag}, you often felt {mood}." / "Lately, “{word}” has come up more than once." / "{Mood} moments tend to come late at night." Section hidden when empty.
Tests: thresholds (below → none), each kind, no digits in rendered text.
Commit `feat: gentle observations on the mood journey`.

### Task 6: Year in colours
Files: core `yearGrid(logs, year)` (12 rows of day cells, latest mood per day), `src/components/mood/YearPixels.tsx`, Mood tab toggle Month / Year (chips).
Tests: core grid shape + leap year, Jest toggle shows the year.
Commit `feat(mobile): a year in colours`.

### Task 7: Journey picture
Files: `npx expo install react-native-view-shot`; `src/components/mood/JourneyCard.tsx` (month name, month heatmap colours, up to 5 most-picked feeling words, the app name — no notes, no numbers), "Keep a picture of this month" button on Mood → captures (`captureRef`, png) → `Sharing.shareAsync`, temp file deleted after.
Tests (mocked view-shot): `the card has no notes or numbers`, `share is called with the captured file`.
Commit `feat(mobile): a private picture of your month`.

### Task 8: Night dim after 22:00
Files: `src/theme/tokens.ts` (mobile-only `midnight` palette: darker background, warmer dimmer text, ember accent; tokens test unchanged for dusk/mist), `src/theme/night.ts` (store that flips at 22:00 / 06:00, checked every minute and on foreground), `theme.ts` (`useTheme` returns midnight when dimming), Settings toggle "Dim after 10 pm" / "Dịu màn hình sau 22 giờ" (pref `nightDim`, default on).
Tests: `night store flips at 22:00 and 06:00`, `useTheme gives the midnight palette at 23:00 when on, not when off`.
Commit `feat(mobile): softer colours late at night`.

### Task 9: Breathing cues
Files: `scripts/generate-sfx.mjs` (+ `breath-in`, `breath-out`, `breath-hold` soft tones), `src/lib/effects.ts` (shared one-shot player with the release-sound session rules; release-sound uses it), `BoxBreathing.tsx` (on each phase change while running: tone + light haptic; chip "Sound & touch cues" / "Âm thanh & rung" remembered in prefs `breathCues`, default on).
Tests: `a cue on each phase change`, `no cues when off`, `no cue after stop`.
Commit `feat(mobile): breathing cues (tone and touch)`.

### Task 10: Report
`docs/mobile/nightly-extras-report.md` incl. rebuild note (view-shot) and the widget deferral. Commit.
