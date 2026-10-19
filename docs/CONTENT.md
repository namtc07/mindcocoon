# Publishing new content (no app update needed)

New writing ideas, sleep stories and practices live in the Supabase table `content`
(migration `supabase/migrations/0006_content.sql`). The app fetches published rows on every cold
start and at most every six hours, keeps them for offline use, and marks them **New** for 14 days.

## Add one

In the Supabase dashboard → Table editor → `content` → Insert row:

| column | value |
|---|---|
| `id` | a short unique id, e.g. `story-harbour` |
| `kind` | `prompt`, `story` or `practice` |
| `locale` | `vi`, `en` or `id` (one row per language) |
| `body` | JSON, see below |
| `published` | `false` while you check it, then `true` |

**prompt** — `{ "text": "Hôm nay có điều gì có thể để mai tính không?" }` (max 120 characters)

**story** —
```json
{ "title": "Bến cảng yên tĩnh", "summary": "Những con thuyền khẽ chạm nhau trong đêm.", "minutes": 4,
  "paragraphs": ["Đêm nay bến cảng thật yên…", "Một sợi thừng kẽo kẹt…"] }
```
(1–20 paragraphs, each under 600 characters)

**practice** —
```json
{ "title": "Hai phút thả lỏng", "summary": "Một khoảng dừng ngắn.", "minutes": 2,
  "steps": [{ "text": "Thả lỏng vai." }, { "text": "Thở ra thật chậm.", "seconds": 20 }, { "text": "Viết một điều bạn thấy.", "input": "line" }] }
```

Anything malformed is skipped silently (check the row if it doesn't appear). Keep the voice of the
app: plain, calm, kind; no exclamation marks; nothing clinical.
