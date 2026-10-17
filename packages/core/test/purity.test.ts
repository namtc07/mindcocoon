// @vitest-environment node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

const SRC = join(__dirname, "..", "src");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : path.endsWith(".ts") ? [path] : [];
  });
}

/** The core runs in browsers and in React Native: no DOM, no React, no Next. */
it("core source uses no browser-only globals or framework imports", () => {
  const offenders = files(SRC).flatMap((file) => {
    // Ignore comments and string contents ("Rain on the window" is fine; `window.` is not).
    const code = readFileSync(file, "utf8")
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "")
      .replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g, (lit) => (lit.startsWith('"') && /^"(react|next\/)/.test(lit) ? lit : '""'));
    const hits = code.match(/\b(window|document|localStorage|sessionStorage|navigator)\b|from "(react|next\/[^"]*)"/g);
    return hits ? [`${file.slice(SRC.length + 1)}: ${[...new Set(hits)].join(", ")}`] : [];
  });
  expect(offenders).toEqual([]);
  expect(files(SRC).length).toBeGreaterThan(20);
});
