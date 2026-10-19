import { isLocale, LOCALES, type Locale } from "./i18n/config";
import type { Practice, PracticeStep } from "./practices";
import type { Story } from "./stories";

/**
 * Writing ideas, sleep stories and practices published later from Supabase (`content` table), so
 * there is something new without an app update. Everything is validated strictly: a malformed,
 * oversized or unknown row is dropped on its own and never spoils the rest. Text only.
 */
export interface RemotePrompt {
  text: string;
  addedAt?: string;
}
export type RemoteStory = Omit<Story, "id"> & { id: string; addedAt?: string };
export type RemotePractice = Omit<Practice, "id"> & { id: string; addedAt?: string };

export interface RemoteContent {
  prompts: Record<Locale, RemotePrompt[]>;
  stories: Record<Locale, RemoteStory[]>;
  practices: Record<Locale, RemotePractice[]>;
}

const perLocale = <T>(): Record<Locale, T[]> => Object.fromEntries(LOCALES.map((l) => [l, [] as T[]])) as Record<Locale, T[]>;
export const EMPTY_CONTENT: RemoteContent = { prompts: perLocale(), stories: perLocale(), practices: perLocale() };

const text = (v: unknown, max: number): v is string => typeof v === "string" && v.trim().length > 0 && v.length <= max;
const minutes = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 30;
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

function story(id: string, b: Record<string, unknown>, addedAt?: string): RemoteStory | null {
  const { title, summary, paragraphs } = b;
  if (!text(title, 80) || !text(summary, 160) || !minutes(b.minutes)) return null;
  if (!Array.isArray(paragraphs) || paragraphs.length < 1 || paragraphs.length > 20) return null;
  if (!paragraphs.every((p) => text(p, 600))) return null;
  return { id: `r-${id}`, title, summary, minutes: b.minutes, paragraphs: paragraphs as string[], addedAt };
}

function step(s: unknown): PracticeStep | null {
  if (!isObject(s) || !text(s.text, 400)) return null;
  if (s.seconds !== undefined && !(typeof s.seconds === "number" && Number.isInteger(s.seconds) && s.seconds > 0 && s.seconds <= 600)) return null;
  if (s.input !== undefined && s.input !== "line" && s.input !== "letter") return null;
  return { text: s.text, ...(s.seconds !== undefined ? { seconds: s.seconds as number } : {}), ...(s.input ? { input: s.input as "line" | "letter" } : {}) };
}

function practice(id: string, b: Record<string, unknown>, addedAt?: string): RemotePractice | null {
  if (!text(b.title, 80) || !text(b.summary, 160) || !minutes(b.minutes)) return null;
  if (!Array.isArray(b.steps) || b.steps.length < 1 || b.steps.length > 12) return null;
  const steps = b.steps.map(step);
  if (steps.some((s) => s === null)) return null;
  return { id: `r-${id}`, title: b.title, summary: b.summary, minutes: b.minutes, steps: steps as PracticeStep[], addedAt };
}

/** Rows from `content` ([{ id, kind, locale, body, created_at }]) → validated content per language. */
export function parseRemoteContent(rows: unknown): RemoteContent {
  const out: RemoteContent = { prompts: perLocale(), stories: perLocale(), practices: perLocale() };
  if (!Array.isArray(rows)) return out;
  for (const row of rows) {
    if (!isObject(row) || !text(row.id, 64) || !isLocale(row.locale) || !isObject(row.body)) continue;
    const addedAt = typeof row.created_at === "string" ? row.created_at : undefined;
    const locale = row.locale;
    if (row.kind === "prompt") {
      if (text(row.body.text, 120)) out.prompts[locale].push({ text: row.body.text, ...(addedAt ? { addedAt } : {}) });
    } else if (row.kind === "story") {
      const s = story(row.id, row.body, addedAt);
      if (s) out.stories[locale].push(s);
    } else if (row.kind === "practice") {
      const p = practice(row.id, row.body, addedAt);
      if (p) out.practices[locale].push(p);
    }
  }
  return out;
}

/** "New" for two weeks after it was published. */
export function isNew(addedAt: string | undefined, now: Date) {
  if (!addedAt) return false;
  const age = now.getTime() - new Date(addedAt).getTime();
  return age >= 0 && age < 14 * 24 * 60 * 60 * 1000;
}
