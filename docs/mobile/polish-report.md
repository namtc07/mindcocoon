# Polish pass — report

Branch `feat/mobile-polish` (on `feat/mobile-nightly-extras` → `feat/mobile-feelings-wind-down`).
Plan: `docs/superpowers/plans/2026-10-19-mobile-polish.md`. No new native modules — reload Metro.

## What changed

- **Today follows the time of day.** From 18:00 to 04:59: check-in (+ suggestions) first, then the
  ways in with "Wind down for sleep" leading, the writing prompt last. By day: the worry-box line,
  the prompt, check-in, then the ways in with "Let it out" first and wind-down last.
- **Calmer Mood tab:** check-in → gently noticed → week → month/year (+ picture) → history, which
  shows the latest five with "Show earlier check-ins".
- **Sounds never fail silently:** a mix that can't play says "That mix couldn't play." and keeps what
  was playing; removing a saved mix shows "Removed My mix 1 · Undo"; Goodnight offers "Keep what's
  playing" (preselected when something plays); volume sliders save when released; turning release
  sounds off stops one in progress.
- **Privacy:** the whole app is covered in the app switcher (not only Vent).
- **Keyboard:** Today and Mood keep the field you're typing in above the keyboard.
- **Touch & breathing:** breathing keeps going when you pull down Control Center or the notification
  shade (stops only in the background); heavy-week nudge targets are 44 pt; the 4th feeling word is
  shown as unavailable; the mini player is announced as a toolbar.
- **Small fixes:** "Remove passcode" asks first; the Vietnamese erase word accepts "xóa"/"xoá"/any
  Unicode form; picture errors say "Couldn't make the picture."; wind-down's breathing step has one
  Next (no duplicate Skip) and no chooser text; Vent forgets a library prompt when you leave it.

## Tests

Mobile Vitest 80, Jest 238; web+core green.

## Owner checklist

1. Open the app before and after 18:00 (change the Mac clock): Today's order changes.
2. Mood: history shows five, "Show earlier check-ins" shows more.
3. Sanctuary: save a mix, remove it, tap Undo; drag a volume slider.
4. Play Campfire → Wind down → the sounds step preselects "Keep what's playing".
5. Swipe up to the app switcher on any screen (Vault open, a worry open): only "MindCocoon" shows.
6. Today: add a note with the keyboard open — the field stays visible.
7. Breathe, then pull down Control Center and back — still breathing.
