import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

const root = join(__dirname, "..");

/**
 * ES imports are hoisted, so a call written between imports runs after all of them.
 * The crypto polyfill must therefore live in its own module, imported first.
 */
it("loads the crypto polyfill, then storage, then the router", () => {
  const entry = readFileSync(join(root, "index.ts"), "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("//"));
  expect(entry).toEqual(['import "./src/polyfills";', 'import "./src/bootstrap";', 'import "expo-router/entry";']);
});

it("installs the polyfill at module scope", () => {
  const polyfills = readFileSync(join(root, "src/polyfills.ts"), "utf8");
  expect(polyfills).toMatch(/^install\(\);$/m);
});
