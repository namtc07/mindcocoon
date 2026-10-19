# Feelings, suggestions, wind-down and release sounds — report

Branch `feat/mobile-feelings-wind-down`. Plan: `docs/superpowers/plans/2026-10-19-mobile-feeling-and-wind-down.md`.
Ideas from How We Feel (feeling words, strategies), Stoic / Calm Sleep (bedtime routine) and UNHEAVY
(sound + touch when destroying text), filtered by MindCocoon's rules (no streaks, private, calm).

**No new native modules — no rebuild.** Reload Metro (`r`).

## What's new

- **Feeling words**: after choosing a mood (Today or Mood), "More precisely?" offers five words for
  that mood (e.g. Heavy → exhausted, lonely, sad, hurt, disappointed); up to three; saved with the
  check-in and shown in the day detail. Changing the mood drops the old mood's words.
- **Something for this feeling** (Today, after checking in): one breath (e.g. Slow exhale · 3 min),
  one ready-made mix (e.g. Rain at sea) and one practice (e.g. 5-4-3-2-1 grounding). Breathe opens
  Sanctuary with that rhythm selected; Listen plays the mix; Try opens the practice. "Not now" hides
  it until tomorrow.
- **Wind down for sleep** (first entry on Today): check in → 1 minute of the matching breath →
  pick a mix (suggested one preselected) and when it fades out (20 / 30 / 60 min) → "Goodnight"
  plays it with the sleep timer and shows "Sleep well." Nothing plays before "Goodnight". Ad-free.
- **Sound and touch when letting go** (Vent): crackle for Burn, water for Float away, a gust for
  Scatter, a soft chime for Fade, with matching light haptics. Settings → "Sound when letting go"
  turns it off. Sounds are generated placeholders (`node scripts/generate-sfx.mjs`).

## Tests

Core: feeling words, suggestions, store feelings. Mobile: feeling chips (Today, Mood, day detail),
suggestion card, wind-down flow, release sounds + setting, ad-free list incl. wind-down.
Totals: web+core 182, mobile Vitest 77, Jest 181.

## Owner checklist

1. Today → tap Anxious → "More precisely?" → pick "overwhelmed" and "restless" → the card
   "Something for this feeling" shows Slow exhale · 3 min, Rain at sea, 5-4-3-2-1 grounding.
2. Tap each row: Sanctuary opens on breathing with Slow exhale selected; the mix plays (toast);
   the practice opens. "Not now" hides the card.
3. Mood tab → the day detail lists your feeling words.
4. Today → Wind down for sleep → pick Heavy → breathe 1 min (4-7-8) → Rainy night is preselected →
   Goodnight → sounds play, mini player shows the timer.
5. Vent → try each way of letting go and listen; Settings → turn "Sound when letting go" off → silent.
