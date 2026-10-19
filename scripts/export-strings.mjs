#!/usr/bin/env node
/**
 * Every word the app shows, in sheets for native speakers to review:
 *   docs/i18n/strings-en.csv — key, english, vietnamese (context), suggested fix, note
 *   docs/i18n/strings-id.csv — key, indonesian, english (context), suggested fix, note
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

const dict = {
  en: (await core("i18n/dictionaries/en.ts")).en,
  vi: (await core("i18n/dictionaries/vi.ts")).vi,
  id: (await core("i18n/dictionaries/id.ts")).id,
};
const { REFLECTION_PROMPTS } = await core("prompts.ts");
const { getPractices } = await core("practices.ts");
const { STORIES } = await core("stories.ts");

/** Rows of [key, text in `lang`, the same text in `context`]. */
function collect(lang, context) {
  const rows = [];
  const walk = (a, b, path) => {
    if (typeof a === "string") return rows.push([path, a, typeof b === "string" ? b : ""]);
    if (a && typeof a === "object") for (const k of Object.keys(a)) walk(a[k], b?.[k], path ? `${path}.${k}` : k);
  };
  walk(dict[lang], dict[context], "ui");
  REFLECTION_PROMPTS[lang].forEach((p, i) => rows.push([`prompts.${i}`, p, REFLECTION_PROMPTS[context][i]]));
  const ctx = getPractices(context);
  getPractices(lang).forEach((p, i) => {
    rows.push([`practices.${p.id}.title`, p.title, ctx[i].title], [`practices.${p.id}.summary`, p.summary, ctx[i].summary]);
    p.steps.forEach((s, j) => rows.push([`practices.${p.id}.step${j + 1}`, s.text, ctx[i].steps[j].text]));
  });
  STORIES[lang].forEach((s, i) => {
    const v = STORIES[context][i];
    rows.push([`stories.${s.id}.title`, s.title, v.title], [`stories.${s.id}.summary`, s.summary, v.summary]);
    s.paragraphs.forEach((p, j) => rows.push([`stories.${s.id}.p${j + 1}`, p, v.paragraphs[j]]));
  });
  return rows;
}

const cell = (v) => `"${String(v).replace(/"/g, '""')}"`;
const NAMES = { en: "english", vi: "vietnamese", id: "indonesian" };
mkdirSync(join(root, "docs/i18n"), { recursive: true });
for (const [lang, context] of [
  ["en", "vi"],
  ["id", "en"],
]) {
  const rows = collect(lang, context);
  const header = ["key", NAMES[lang], `${NAMES[context]} (context)`, "suggested fix", "note"];
  const csv = [header, ...rows.map((r) => [...r, "", ""])].map((r) => r.map(cell).join(",")).join("\n");
  const out = join(root, `docs/i18n/strings-${lang}.csv`);
  writeFileSync(out, "﻿" + csv + "\n");
  const words = rows.reduce((n, r) => n + r[1].split(/\s+/).filter(Boolean).length, 0);
  console.log(`${lang}: ${rows.length} strings, about ${words} words → ${out}`);
}
