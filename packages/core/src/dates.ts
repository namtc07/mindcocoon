/** Local-time helpers. Day keys are `YYYY-MM-DD` in the user's timezone. */

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dayKeyFromISO(iso: string): string {
  return dayKey(new Date(iso));
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Monday-first weekday index (0 = Monday). */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function partOfDay(date: Date): "morning" | "afternoon" | "evening" | "night" {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "night";
}

export const formatTime = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(new Date(iso));

export const formatDay = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric" }).format(date);

export const formatShortDay = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date);

export const formatWeekdayInitial = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(date);
