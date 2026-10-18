# More choices — report

Branch `feat/mobile-more-choices`. Plan: `docs/superpowers/plans/2026-10-18-mobile-more-choices.md`.
The owner found the app "dull, with few choices" and asked Claude to decide and build (no Q&A),
so every product choice here is Claude's — see the ledger for each call.

**JS only — no new native modules, no rebuild.** Reload Metro (`r`) to see it.

## What's new

- **Breathing (Sanctuary → Breathe)**: three rhythms — Box (4·4·4·4), 4-7-8 (helps sleep), Slow
  exhale (4·6, for anxious moments) — and 1 / 3 / 5 minutes. Both remembered; locked while
  breathing. The square still draws on the UI thread; the dot travels only for Box.
- **Mixes (Sanctuary → Sounds)**: four ready-made mixes (Rainy night, By the fire, Sea breeze,
  Rain at sea) and "Save this mix" (up to 5, named "My mix 1…", removable). A mix with a premium
  sound whose unlock ended plays the rest.
- **Ways to let go (Vent)**: Burn (embers, as before), Float away, Scatter in the wind, Fade into the
  night. Chosen under the editor and remembered. Reduce Motion → the short fade for all.
- **Gentle practices** (Today entry, Sanctuary section, `/practices`): 5-4-3-2-1 grounding, body scan,
  three good things, a kind letter to yourself. One step at a time with quiet dots (no numbers),
  timed steps show a soft countdown and never auto-advance. Written answers are kept only if you
  choose "Keep in my vault" (encrypted); "Let it go" or leaving the screen discards them; the app
  switcher sees a cover.
- **Prompt library** (Today → "More prompts", `/prompts`): every reflection prompt, "Surprise me",
  tap one to write about it; Vent keeps the same prompt if you switch language.
- No ads on any of the new screens (covered by the ad-free screen test).

## Tests

Core: breathing patterns, mixes, practices, promptAt. Mobile: breathing chooser/timing, applyMix,
mix chips, rituals, practices, prompt library, ad-free screens. Totals: web+core 176, mobile Vitest
77, Jest 158.

## Owner checklist (simulator or phone)

1. Sanctuary → Breathe: try 4-7-8 for 1 min — "Hold" lasts 7 s, "Breathe out" 8 s; Slow exhale has
   no holds; 3 min runs 3 min. Reopen the app — your choice is still selected.
2. Sanctuary → Sounds: tap "Rainy night" → rain + night wind play; change a volume → the chip is no
   longer selected; "Save this mix" → "My mix 1" appears; remove it with ×.
3. Vent: try each way to let go with a few lines; turn on Reduce Motion and check it's a soft fade.
4. Today → Gentle practices → Three good things: write three lines → Finish → Keep in my vault →
   appears in the vault; repeat with "Let it go" → nothing in the vault. Leave a practice midway and
   come back → it starts fresh.
5. Today → More prompts → pick one → Vent shows it; switch language in Settings → same prompt in
   the other language.
