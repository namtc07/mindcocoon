export const LOCALES = ["vi", "en", "id"] as const;
export type Locale = (typeof LOCALES)[number];

/** BCP 47 tag for dates and speech in each language. */
export const LOCALE_TAGS: Record<Locale, string> = { vi: "vi-VN", en: "en-US", id: "id-ID" };
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "mc-locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Parses an Accept-Language header into language tags ordered by q-weight. */
function parseAcceptLanguage(header: string): string[] {
  return header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      const weight = q ? Number.parseFloat(q.trim().slice(2)) : 1;
      return { tag: tag.toLowerCase(), weight: Number.isNaN(weight) ? 0 : weight, index };
    })
    .filter((entry) => entry.tag && entry.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index)
    .map((entry) => entry.tag);
}

/** Cookie (explicit user choice) wins, then the browser's languages, then English. */
export function resolveLocale(input: { cookie?: string; acceptLanguage?: string | null }): Locale {
  if (isLocale(input.cookie)) return input.cookie;
  for (const tag of parseAcceptLanguage(input.acceptLanguage ?? "")) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
