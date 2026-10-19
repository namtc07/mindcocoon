/**
 * Small seasonal touches for the sky and Kén: Tết, Mid-autumn, Christmas, New Year, and full-moon
 * nights. Never a reward or something to collect — just so the app doesn't look the same all year.
 */
export type Occasion = "tet" | "mid-autumn" | "christmas" | "new-year" | "full-moon";

const DAY = 24 * 60 * 60 * 1000;

/** First day of the Lunar New Year (Tết Nguyên Đán), 2026–2035. */
const TET = ["2026-02-17", "2027-02-06", "2028-01-26", "2029-02-13", "2030-02-03", "2031-01-23", "2032-02-11", "2033-01-31", "2034-02-19", "2035-02-08"];
/** 15th day of the 8th lunar month (Tết Trung thu), 2026–2035. */
const MID_AUTUMN = ["2026-09-25", "2027-09-15", "2028-10-03", "2029-09-22", "2030-09-12", "2031-10-01", "2032-09-19", "2033-09-08", "2034-09-27", "2035-09-16"];

/** Local calendar days between two dates (b − a). */
const daysBetween = (a: Date, b: Date) =>
  Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime() - new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()) / DAY);

const local = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const near = (dates: string[], now: Date, before: number, after: number) =>
  dates.some((iso) => {
    const diff = daysBetween(local(iso), now);
    return diff >= -before && diff <= after;
  });

/** A known full moon (3 January 2026, 10:03 UTC) and the mean length of a lunar month. */
const FULL_MOON_REF = Date.UTC(2026, 0, 3, 10, 3);
const SYNODIC = 29.530588853 * DAY;

export function isFullMoonNight(now: Date): boolean {
  const offset = (((now.getTime() - FULL_MOON_REF) % SYNODIC) + SYNODIC) % SYNODIC;
  return Math.min(offset, SYNODIC - offset) <= DAY;
}

export function occasionFor(now: Date): Occasion | null {
  if (near(TET, now, 3, 4)) return "tet";
  if (near(MID_AUTUMN, now, 2, 1)) return "mid-autumn";
  const m = now.getMonth();
  const d = now.getDate();
  if ((m === 11 && d === 31) || (m === 0 && d === 1)) return "new-year";
  if (m === 11 && d >= 20 && d <= 26) return "christmas";
  if (isFullMoonNight(now)) return "full-moon";
  return null;
}
