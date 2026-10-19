# Nightly extras — report

Branch `feat/mobile-nightly-extras`, **built on `feat/mobile-feelings-wind-down`** (not merged yet).
Plan: `docs/superpowers/plans/2026-10-19-mobile-nightly-extras.md`.

**New native module: `react-native-view-shot`** → rebuild the dev client:
`npx expo prebuild --clean -p ios && (cd ios && pod install) && npx expo run:ios`.

## What's new

- **Worry box**: in Vent, "Set it down until tomorrow" keeps the words encrypted until 06:00. In the
  morning Today shows "Something you set down is ready to look at." → read it → Let it
  go / Keep in my vault / Another day. Heavy words get the gentle card first. Needs an unlocked vault.
- **Evening reminder** now opens "Wind down for sleep" directly.
- **Three more practices**: An unsent letter, A safe place, Tense and release (seven in total).
- **Prompt themes**: Heavy days, Relationships, Study & work, Kindness to yourself, Hope, Knowing
  yourself; "Surprise me" picks within the theme.
- **Gently noticed** (Mood tab): up to three sentences, words only, from the last 30 days, counted in
  distinct days (one long evening is never "a pattern"), e.g.
  "On days tagged Work, you often felt anxious." Hidden when there isn't enough to be fair.
- **Year in colours** (Mood tab → Year): one row per month, one square per day.
- **Picture of your month** (Mood tab): a card of colours and feeling words — no notes, no counts —
  saved or shared only when you tap "Save or share".
- **Dim after 10 pm** (Settings, on by default): softer, warmer Midnight colours from 22:00 to 06:00.
- **Breathing cues**: a rising tone to breathe in, falling to breathe out, a soft tick to hold, and a
  light vibration — "Sound & touch cues" toggles it, even mid-session. Cues never disturb a
  paused Sanctuary mix's lock-screen controls.

**Not done: home-screen widget.** `expo-widgets` needs an App Group, which a free Apple ID can't
sign; it comes with the paid Apple Developer account.

## Tests

Web+core 192, mobile Vitest 78, Jest 215 (worry box, notification routing, practices, prompt themes,
insights, year grid, journey picture, night dim, breathing cues).

## Owner checklist

1. Vent → write → "Set it down until tomorrow" → set the phone clock to 07:00 → Today shows the line
   → open → try each of the three choices.
2. Settings → Evening reminder 22:00 → wait for it (or set the clock) → tap → Wind down opens.
3. Today → More prompts → filter by Relationships.
4. Mood → check in a few times with the same tag/word → "Gently noticed" appears; switch Month/Year;
   "Keep a picture of this month" → Save or share.
5. Set the clock to 22:30 → colours turn warmer and darker; Settings → "Dim after 10 pm" off → back.
6. Sanctuary → Breathe → hear and feel each phase; turn cues off.
