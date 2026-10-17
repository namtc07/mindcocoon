import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const mobile = join(__dirname, "..");
const root = join(mobile, "..");

/**
 * The Expo CLI is hoisted to the repo root; if npm nests Expo/React packages under
 * mobile/node_modules, Metro crashes at start (seen in M2) or React is duplicated.
 */
describe("monorepo install layout", () => {
  it("keeps Expo and React packages hoisted to the root", () => {
    const dir = join(mobile, "node_modules");
    const nested = existsSync(dir)
      ? readdirSync(dir).flatMap((name) => (name.startsWith("@") ? readdirSync(join(dir, name)).map((n) => `${name}/${n}`) : [name]))
      : [];
    expect(nested.filter((n) => /^(expo|@expo\/|react($|-native|-dom)|@react-native\/)/.test(n))).toEqual([]);
  });

  it("pins the root expo-router to mobile's version", () => {
    const base = (spec: string) => spec.replace(/^[~^]/, "");
    const rootPkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    const mobilePkg = JSON.parse(readFileSync(join(mobile, "package.json"), "utf8"));
    expect(base(rootPkg.devDependencies["expo-router"])).toBe(base(mobilePkg.dependencies["expo-router"]));
  });
});
