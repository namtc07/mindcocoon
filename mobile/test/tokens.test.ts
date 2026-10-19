import { MOODS } from "@mindcocoon/core/moods";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { tokens, type ThemeColors } from "../src/theme/tokens";

/** Colours must stay identical to the web (app/globals.css: :root = Mist, .dark = Dusk). */
function cssVars(block: "root" | "dark"): Record<string, string> {
  const css = readFileSync(join(__dirname, "../../app/globals.css"), "utf8");
  const selector = block === "root" ? /\n:root \{([\s\S]*?)\n\}/ : /\n\.dark \{([\s\S]*?)\n\}/;
  const body = css.match(selector)?.[1] ?? "";
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().toLowerCase()]));
}

/** "#abc123" / "rgb(1 2 3 / 0.1)" / "rgba(1, 2, 3, 0.1)" → "r,g,b,a" for comparison. */
function norm(color: string): string {
  const c = color.trim().toLowerCase();
  if (c.startsWith("#")) {
    const n = Number.parseInt(c.slice(1), 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},1`;
  }
  const nums = c.match(/[\d.]+/g)!.map(Number);
  return `${nums[0]},${nums[1]},${nums[2]},${nums[3] ?? 1}`;
}

const MAP: Record<Exclude<keyof ThemeColors, "mood">, string> = {
  background: "background",
  foreground: "foreground",
  surface: "surface",
  card: "card",
  primary: "primary",
  primaryForeground: "primary-foreground",
  muted: "muted",
  mutedForeground: "muted-foreground",
  border: "border",
  ember: "ember",
  destructive: "destructive",
};

describe.each([
  ["dusk", "dark"],
  ["mist", "root"],
] as const)("%s tokens", (theme, block) => {
  const vars = cssVars(block);

  it("match the web palette", () => {
    for (const [token, cssVar] of Object.entries(MAP) as [keyof typeof MAP, string][]) {
      expect(norm(tokens[theme][token]), token).toBe(norm(vars[cssVar]));
    }
  });

  it("use the validated mood colours", () => {
    for (const { id: mood } of MOODS) {
      expect(norm(tokens[theme].mood[mood]), mood).toBe(norm(vars[`mood-${mood}`]));
    }
  });
});
