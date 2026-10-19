/** WCAG relative luminance of a #rrggbb colour. */
function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [16, 8, 0].map((s) => {
    const v = ((n >> s) & 255) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two #rrggbb colours (1–21). */
export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const LIGHT = "#ffffff";
const DARK = "#0f172a";

/** Text colour (white or slate ink) that reads best on a filled background. */
export function inkOn(background: string) {
  return contrast(LIGHT, background) >= contrast(DARK, background) ? LIGHT : DARK;
}

/** Mix a #rrggbb colour toward black (0–1). */
function darken(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) * (1 - amount)).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}

/** A filled tile in a colour: the colour itself when text reads well on it, else a slightly deeper shade. */
export function readableFill(color: string): { background: string; ink: string } {
  let background = color;
  for (let step = 1; contrast(inkOn(background), background) < 4.5 && step <= 10; step++) background = darken(color, step * 0.05);
  return { background, ink: inkOn(background) };
}
