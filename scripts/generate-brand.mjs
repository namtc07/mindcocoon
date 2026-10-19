// Renders the MindCocoon mark (a cocoon hanging on a silk thread under a crescent moon) into the
// app icon, splash and Android adaptive-icon layers. Run: npm run gen:brand
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "mobile", "assets");
const SLATE = "#0F172A";
const MIST = "#F1F5F9";

const SHAPE = "M512,300 C596,300 704,430 706,590 C708,762 612,866 512,866 C412,866 316,762 318,590 C320,430 428,300 512,300 Z";
const defs = `
  <radialGradient id="glow" cx="50%" cy="56%" r="50%">
    <stop offset="0" stop-color="#22325a"/><stop offset="1" stop-color="${SLATE}"/>
  </radialGradient>
  <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#a9d6cb"/><stop offset="0.55" stop-color="#7FB5A8"/><stop offset="1" stop-color="#D9A86C"/>
  </linearGradient>
  <clipPath id="shape"><path d="M512,300 C596,300 704,430 706,590 C708,762 612,866 512,866 C412,866 316,762 318,590 C320,430 428,300 512,300 Z"/></clipPath>
  <radialGradient id="ember" cx="50%" cy="78%" r="45%">
    <stop offset="0" stop-color="#F6D29B" stop-opacity="0.85"/><stop offset="1" stop-color="#D9A86C" stop-opacity="0"/>
  </radialGradient>
  <mask id="crescent"><rect width="1024" height="1024" fill="white"/><circle cx="800" cy="215" r="62" fill="black"/></mask>`;

/** The mark itself; `mono` draws a single-colour silhouette for Android's themed icon. */
function mark({ mono = false } = {}) {
  if (mono) {
    return `<line x1="512" y1="110" x2="512" y2="320" stroke="white" stroke-width="10" stroke-linecap="round"/>
      <path d="${SHAPE}" fill="white"/>`;
  }
  const strands = [
    "M300,470 C420,420 610,530 724,470",
    "M300,610 C430,670 600,560 724,620",
    "M300,745 C420,700 600,800 724,740",
  ]
    .map((d) => `<path d="${d}" fill="none" stroke="${MIST}" stroke-opacity="0.38" stroke-width="12" stroke-linecap="round"/>`)
    .join("");
  return `
    <line x1="512" y1="110" x2="512" y2="320" stroke="#7FB5A8" stroke-opacity="0.75" stroke-width="7" stroke-linecap="round"/>
    <circle cx="770" cy="240" r="72" fill="${MIST}" mask="url(#crescent)"/>
    <circle cx="250" cy="260" r="7" fill="${MIST}" fill-opacity="0.7"/>
    <circle cx="300" cy="170" r="5" fill="${MIST}" fill-opacity="0.5"/>
    <circle cx="840" cy="430" r="6" fill="${MIST}" fill-opacity="0.55"/>
    <path d="${SHAPE}" fill="url(#body)"/>
    <g clip-path="url(#shape)"><rect x="300" y="560" width="424" height="320" fill="url(#ember)"/>${strands}
      <ellipse cx="445" cy="470" rx="48" ry="96" fill="white" fill-opacity="0.16"/>
    </g>`;
}

function svg({ background = true, scale = 1, mono = false } = {}) {
  const t = `translate(${512 * (1 - scale)} ${512 * (1 - scale)}) scale(${scale})`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs>${defs}</defs>
    ${background ? `<rect width="1024" height="1024" fill="url(#glow)"/>` : ""}
    <g transform="${t}">${mark({ mono })}</g>
  </svg>`;
}

const render = (name, source, size = 1024) =>
  sharp(Buffer.from(source)).resize(size, size).png({ compressionLevel: 9 }).toFile(join(out, name));

mkdirSync(out, { recursive: true });
await Promise.all([
  render("icon.png", svg()).then(() => sharp(join(out, "icon.png")).flatten({ background: SLATE }).toBuffer()).then((b) => sharp(b).toFile(join(out, "icon.png"))),
  render("splash-icon.png", svg({ background: false })),
  // Android keeps the middle ~66 % of the foreground visible, so the mark is scaled into it.
  render("android-icon-foreground.png", svg({ background: false, scale: 0.62 })),
  render("android-icon-background.png", `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><defs>${defs}</defs><rect width="1024" height="1024" fill="url(#glow)"/></svg>`),
  render("android-icon-monochrome.png", svg({ background: false, scale: 0.62, mono: true })),
  render("favicon.png", svg(), 48),
]);
console.log("brand assets written to", out);
