# Review the English (and later Indonesian) wording

`strings-en.csv` holds every English line the app shows (about 4,000 words), and `strings-id.csv` every Indonesian one (to be checked by a native Indonesian speaker the same way): the interface, writing
ideas, practices and sleep stories. Regenerate it with `npm run export:strings`.

**For the reviewer (a native English speaker):**

- Open the file in Google Sheets or Excel.
- Read the `english` column. Where something sounds stiff, translated, preachy or "therapy-speak",
  write a better version in `suggested fix`. Keep the meaning and roughly the length.
- Words in `{curly braces}` are filled in by the app (a name, a time) — keep them as they are.
- The voice we want: calm, plain, kind, like a thoughtful friend at night. Never clinical, never
  cheerful in a forced way, no exclamation marks.
- `vietnamese (context)` is only there to show the intent; no need to read it.

Send the sheet back; the fixes go into `packages/core/src` (dictionaries, prompts, practices, stories).
