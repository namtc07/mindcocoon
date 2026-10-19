import { describe, expect, it } from "vitest";
import { MIDNIGHT, tokens } from "../src/theme/tokens";

// sRGB → linear → simulated colour-vision deficiency (Machado 2009, severity 1) → OKLab ΔE × 100.
const toLin = (c: number) => (c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const rgb = (h: string) => [16, 8, 0].map((s) => toLin((parseInt(h.slice(1), 16) >> s) & 255));
const CVD: Record<string, number[][]> = {
  normal: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
};
function oklab([r, g, b]: number[]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
const sim = (c: number[], m: number[][]) => m.map((row) => row[0] * c[0] + row[1] * c[1] + row[2] * c[2]);
function separation(a: string, b: string) {
  return Math.min(
    ...Object.values(CVD).map((m) => {
      const [x, y] = [oklab(sim(rgb(a), m)), oklab(sim(rgb(b), m))];
      return 100 * Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
    }),
  );
}

describe("ten mood colours", () => {
  it.each([
    ["dusk", tokens.dusk.mood],
    ["mist", tokens.mist.mood],
    ["midnight", MIDNIGHT.mood],
  ] as const)("every pair stays apart in %s, also with red-green colour blindness (≥ 6; the legend and labels carry the rest)", (_, moods) => {
    const colours = Object.entries(moods);
    for (let i = 0; i < colours.length; i++)
      for (let j = i + 1; j < colours.length; j++)
        expect(separation(colours[i][1], colours[j][1]), `${colours[i][0]} vs ${colours[j][0]}`).toBeGreaterThanOrEqual(6);
  });
});
