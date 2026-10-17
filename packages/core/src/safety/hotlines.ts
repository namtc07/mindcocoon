import type { Locale } from "../i18n/config";

export interface Hotline {
  id: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  name: Record<Locale, string>;
  phone: string;
  hours: "24/7" | { tz: string; open: string; close: string };
  audience: "all" | "youth";
  /** Flip to true only after the number AND hours were checked by a person (launch checklist). */
  verified: boolean;
}

/**
 * Support lines shown on /help. NOT yet verified — every number and its hours
 * must be confirmed before launch (docs/LAUNCH_CHECKLIST.md).
 */
export const HOTLINES: Hotline[] = [
  {
    id: "vn-115",
    country: "VN",
    name: { vi: "Cấp cứu y tế", en: "Medical emergency" },
    phone: "115",
    hours: "24/7",
    audience: "all",
    verified: false,
  },
  {
    id: "vn-111",
    country: "VN",
    name: {
      vi: "Tổng đài quốc gia bảo vệ trẻ em",
      en: "National child protection hotline",
    },
    phone: "111",
    hours: "24/7",
    audience: "youth",
    verified: false,
  },
  {
    id: "us-988",
    country: "US",
    name: { vi: "988 Suicide & Crisis Lifeline", en: "988 Suicide & Crisis Lifeline" },
    phone: "988",
    hours: "24/7",
    audience: "all",
    verified: false,
  },
  {
    id: "gb-samaritans",
    country: "GB",
    name: { vi: "Samaritans", en: "Samaritans" },
    phone: "116 123",
    hours: "24/7",
    audience: "all",
    verified: false,
  },
  {
    id: "au-lifeline",
    country: "AU",
    name: { vi: "Lifeline Australia", en: "Lifeline Australia" },
    phone: "13 11 14",
    hours: "24/7",
    audience: "all",
    verified: false,
  },
  {
    id: "sg-sos",
    country: "SG",
    name: { vi: "Samaritans of Singapore", en: "Samaritans of Singapore" },
    phone: "1767",
    hours: "24/7",
    audience: "all",
    verified: false,
  },
];

export const FIND_A_HELPLINE_URL = "https://findahelpline.com";

function minutesIn(tz: string, now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Whether the line is answering right now, in its own time zone (handles overnight hours). */
export function isOpenNow(line: Hotline, now: Date): boolean {
  if (line.hours === "24/7") return true;
  const current = minutesIn(line.hours.tz, now);
  const open = toMinutes(line.hours.open);
  const close = toMinutes(line.hours.close);
  return open <= close ? current >= open && current < close : current >= open || current < close;
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}
