/** Late night for the dimmed palette: 22:00 until 06:00, local time. */
export const NIGHT_START = 22;
export const NIGHT_END = 6;

export function isNightHour(date: Date): boolean {
  const h = date.getHours();
  return h >= NIGHT_START || h < NIGHT_END;
}
