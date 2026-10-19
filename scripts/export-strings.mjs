#!/usr/bin/env node
/**
 * Every English word the app shows, in one sheet for a native speaker to review:
 * docs/i18n/strings-en.csv  — columns: key, english, vietnamese (for context), suggested fix, note.
 * Covers the UI dictionary, writing ideas, practices and sleep stories.
 *
 *   npm run export:strings
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url);
const core = (p) => jiti.import(join(root, "packages/core/src", p));

const { en } = await core("i18n/dictionaries/en.ts");
const { vi } = await core("i18n/dictionaries/vi.ts");
const { REFLECTION_PROMPTS } = await core("prompts.ts");
const { getPractices } = await core("practices.ts");
const { STORIES } = await core("stories.ts");

const rows = [];
function walk(a, b, path) {
  if (typeof a === "string") return rows.push([path, a, typeof b === "string" ? b : ""]);
  if (a && typeof a === "object") for (const k of Object.keys(a)) walk(a[k], b?.[k], path ? `${path}.${k}` : k);
}
walk(en, vi, "ui");
REFLECTION_PROMPTS.en.forEach((p, i) => rows.push([`prompts.${i}`, p, REFLECTION_PROMPTS.vi[i]]));
const viPractices = getPractices("vi");
getPractices("en").forEach((p, i) => {
  const v = viPractices[i];
  rows.push([`practices.${p.id}.title`, p.title, v.title], [`practices.${p.id}.summary`, p.summary, v.summary]);
  p.steps.forEach((s, j) => rows.push([`practices.${p.id}.step${j + 1}`, s.text, v.steps[j].text]));
});
STORIES.en.forEach((s, i) => {
  const v = STORIES.vi[i];
  rows.push([`stories.${s.id}.title`, s.title, v.title], [`stories.${s.id}.summary`, s.summary, v.summary]);
  s.paragraphs.forEach((p, j) => rows.push([`stories.${s.id}.p${j + 1}`, p, v.paragraphs[j]]));
});

const cell = (v) => `"${String(v).replace(/"/g, '""')}"`;
const csv = [["key", "english", "vietnamese (context)", "suggested fix", "note"], ...rows.map((r) => [...r, "", ""])].map((r) => r.map(cell).join(",")).join("\n");
const out = join(root, "docs/i18n/strings-en.csv");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, "﻿" + csv + "\n");
const words = rows.reduce((n, r) => n + r[1].split(/\s+/).filter(Boolean).length, 0);
console.log(`${rows.length} strings, about ${words} English words → ${out}`);
