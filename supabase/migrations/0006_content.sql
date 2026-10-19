-- Writing ideas, sleep stories and practices published after an app version, so there is
-- something new without an update. Read anonymously (published rows only); edited in the dashboard.
--   kind    'prompt' | 'story' | 'practice'
--   locale  'vi' | 'en' | 'id'
--   body    prompt:   { "text": "…" }                                   (≤ 120 chars)
--           story:    { "title", "summary", "minutes", "paragraphs": ["…", …] }   (1–20 paragraphs)
--           practice: { "title", "summary", "minutes", "steps": [{ "text", "seconds"?, "input"?: "line"|"letter" }] }
-- The app validates every row and silently skips anything malformed. Shown as "New" for 14 days.

create table public.content (
  id text primary key,
  kind text not null check (kind in ('prompt', 'story', 'practice')),
  locale text not null check (locale in ('vi', 'en', 'id')),
  body jsonb not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.content enable row level security;

create policy "content: anyone reads published"
  on public.content for select to anon, authenticated
  using (published);

-- Supabase grants ALL on new public tables by default (see 0002): keep clients read-only.
revoke all on public.content from anon, authenticated;
grant select on public.content to anon, authenticated;

create index content_published_created_idx on public.content (created_at) where published;
