import { ACCENTED_RISK_PHRASES, EXCLUSIONS, RISK_PHRASES } from "./phrases";

/**
 * On-device check for words that suggest someone may be thinking about harming
 * themselves. Runs only in the browser, stores nothing, sends nothing.
 */

export function normalizeForMatch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const ALL_RISK = [...RISK_PHRASES.vi, ...RISK_PHRASES.en];

export function checkText(text: string): { flagged: boolean } {
  const accented = text.normalize("NFC").toLowerCase();
  if (ACCENTED_RISK_PHRASES.some((phrase) => accented.includes(phrase))) return { flagged: true };

  let padded = ` ${normalizeForMatch(text)} `;
  for (const exclusion of EXCLUSIONS) padded = padded.replaceAll(` ${exclusion} `, " ");
  return { flagged: ALL_RISK.some((phrase) => padded.includes(` ${phrase} `)) };
}
