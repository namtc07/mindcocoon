# Mobile — Polish pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Tóm tắt (VI):** Đợt cải thiện trước khi lên store (chủ dự án đồng ý: "làm đợt cải thiện"). Không thêm tính năng: sắp xếp lại Hôm nay theo giờ, gọn tab Cảm xúc, và sửa các lỗi nhỏ người dùng sẽ gặp (chọn lọc từ các ledger trước).

**Goal:** The app feels calmer and more finished: the right thing first at the right time, and no rough edges in everyday use.

**Architecture:** Mobile-only changes on existing components; one helper in core (`isEveningMode`). Branch `feat/mobile-polish` on top of `feat/mobile-nightly-extras`.

**Spec:** owner's request 2026-10-19; deferred minors in the M3, M6, more-choices, feelings/wind-down and nightly-extras ledgers. Choices are **[Claude quyết]**.

## Global Constraints
Same as previous milestones (no counters/streaks; ad rules; en/vi parity; 44 pt; Reduce Motion; TDD; gate before every commit with `&&`).

## Review Focus
1. Today order at the switch times (18:00 / 05:00) and with every optional block absent/present.
2. App-wide privacy cover: nothing private visible in the app switcher on any screen; never blocks use while active.
3. Mixes: a failed or empty mix tells the person; removing a saved mix can be undone; Goodnight never silently replaces what's playing.
4. Keyboard never covers the field being typed in on Today/Mood.

---

### Task 1: Today in the right order
Core `isEveningMode(date)` (18:00–04:59). Evening: heavy nudge → check-in (+ feelings) → suggestion → entries (Wind down first) → prompt. Daytime: heavy nudge → worry-ready line → prompt → check-in → suggestion → entries (Let it out first, Wind down last). Tests: order by time; switch at 18:00 and 05:00.

### Task 2: Calmer Mood tab
Order: check-in form → gently noticed → week → month/year (+ picture) → history. History shows the latest 5 with "Show earlier check-ins" (up to 30). Tests.

### Task 3: Sounds that never fail silently
`applyMix` returns how many sounds started; Listen / Goodnight / mix chips toast "That mix couldn't play." when none; removing a saved mix shows a toast with **Undo** (Toast gains an optional action); Goodnight offers "Keep what's playing" (preselected when something plays); sliders save prefs on release (`onSlidingComplete`) instead of every step; turning release sounds off stops one that's playing. Tests for each.

### Task 4: Privacy, keyboard and touch
- App-wide privacy cover in the root layout whenever the app isn't active (replaces Vent/practice covers).
- `Screen` gets `keyboardShouldPersistTaps="handled"` + keyboard avoidance so Today's note and Mood's form stay visible.
- Breathing stops only when the app goes to the background (not for Control Center / notification shade).
- 44 pt targets for the heavy-nudge actions; the 4th feeling chip is disabled at three; MiniPlayer "Now playing" is an accessible region.
Tests for each that Jest can express.

### Task 5: Small fixes
"Remove passcode" asks to confirm; `vault.unsupported` says "this phone"; the erase word accepts NFC/NFD and "xoá"; journey picture errors say "Couldn't make the picture."; wind-down's breathing step has no duplicate Skip and its intro matches; Vent clears a library prompt when it loses focus (Today's prompt never shows a stale library one). Tests.

### Task 6: Report
`docs/mobile/polish-report.md`.
