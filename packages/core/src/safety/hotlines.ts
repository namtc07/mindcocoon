import type { Locale } from "../i18n/config";

export interface Hotline {
  id: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  name: Record<Locale, string>;
  phone: string;
  /** Always open, or daily hours in the line's own time zone (optionally only on some weekdays, 0 = Sunday). */
  hours: "24/7" | { tz: string; open: string; close: string; days?: number[] };
  audience: "all" | "youth";
  /** Flip to true only after a person rang or confirmed the number with the operator (launch checklist). */
  verified: boolean;
  /** Where the number and hours were checked, and when (YYYY-MM-DD). */
  source: string;
  checkedOn: string;
}

const CHECKED = "2026-10-19";
const line = (h: Omit<Hotline, "verified" | "checkedOn">): Hotline => ({ ...h, verified: false, checkedOn: CHECKED });

/**
 * Support lines shown on /help, by country. Checked against the operators' or health ministries'
 * pages on CHECKED (see `source`); a person still confirms each before launch (docs/LAUNCH_CHECKLIST.md).
 */
export const HOTLINES: Hotline[] = [
  line({
    id: "vn-ngay-mai",
    country: "VN",
    name: { vi: "Đường dây nóng Ngày Mai (trầm cảm, khủng hoảng tâm lý)", en: "Ngày Mai helpline (depression & emotional crisis)" },
    phone: "096 306 1414",
    hours: { tz: "Asia/Ho_Chi_Minh", open: "13:00", close: "20:30", days: [3, 4, 5, 6, 0] },
    audience: "all",
    source: "https://duongdaynongngaymai.vn",
  }),
  line({
    id: "vn-111",
    country: "VN",
    name: { vi: "Tổng đài quốc gia bảo vệ trẻ em", en: "National child protection hotline" },
    phone: "111",
    hours: "24/7",
    audience: "youth",
    source: "https://tongdai111.vn/",
  }),
  line({
    id: "vn-115",
    country: "VN",
    name: { vi: "Cấp cứu y tế", en: "Medical emergency" },
    phone: "115",
    hours: "24/7",
    audience: "all",
    source: "https://duongdaynongngaymai.vn",
  }),
  line({
    id: "us-988",
    country: "US",
    name: { vi: "988 Suicide & Crisis Lifeline", en: "988 Suicide & Crisis Lifeline" },
    phone: "988",
    hours: "24/7",
    audience: "all",
    source: "https://988lifeline.org/",
  }),
  line({
    id: "ca-988",
    country: "CA",
    name: { vi: "9-8-8 Suicide Crisis Helpline", en: "9-8-8 Suicide Crisis Helpline" },
    phone: "9-8-8",
    hours: "24/7",
    audience: "all",
    source: "https://988.ca/",
  }),
  line({
    id: "ca-kids-help-phone",
    country: "CA",
    name: { vi: "Kids Help Phone", en: "Kids Help Phone" },
    phone: "1-800-668-6868",
    hours: "24/7",
    audience: "youth",
    source: "https://kidshelpphone.ca/",
  }),
  line({
    id: "gb-samaritans",
    country: "GB",
    name: { vi: "Samaritans", en: "Samaritans" },
    phone: "116 123",
    hours: "24/7",
    audience: "all",
    source: "https://www.samaritans.org/how-we-can-help/contact-samaritan/",
  }),
  line({
    id: "gb-childline",
    country: "GB",
    name: { vi: "Childline", en: "Childline" },
    phone: "0800 1111",
    hours: "24/7",
    audience: "youth",
    source: "https://www.childline.org.uk/get-support/contacting-childline/",
  }),
  line({
    id: "ie-samaritans",
    country: "IE",
    name: { vi: "Samaritans Ireland", en: "Samaritans Ireland" },
    phone: "116 123",
    hours: "24/7",
    audience: "all",
    source: "https://www.samaritans.org/how-we-can-help/contact-samaritan/",
  }),
  line({
    id: "ie-pieta",
    country: "IE",
    name: { vi: "Pieta", en: "Pieta crisis helpline" },
    phone: "1800 247 247",
    hours: "24/7",
    audience: "all",
    source: "https://www.pieta.ie/",
  }),
  line({
    id: "ie-childline",
    country: "IE",
    name: { vi: "Childline (ISPCC)", en: "Childline (ISPCC)" },
    phone: "1800 66 66 66",
    hours: "24/7",
    audience: "youth",
    source: "https://www.childline.ie/",
  }),
  line({
    id: "au-lifeline",
    country: "AU",
    name: { vi: "Lifeline Australia", en: "Lifeline Australia" },
    phone: "13 11 14",
    hours: "24/7",
    audience: "all",
    source: "https://www.lifeline.org.au/",
  }),
  line({
    id: "au-kids-helpline",
    country: "AU",
    name: { vi: "Kids Helpline", en: "Kids Helpline" },
    phone: "1800 55 1800",
    hours: "24/7",
    audience: "youth",
    source: "https://kidshelpline.com.au/",
  }),
  line({
    id: "nz-1737",
    country: "NZ",
    name: { vi: "1737 Need to talk?", en: "1737 Need to talk?" },
    phone: "1737",
    hours: "24/7",
    audience: "all",
    source: "https://1737.org.nz/",
  }),
  line({
    id: "nz-youthline",
    country: "NZ",
    name: { vi: "Youthline", en: "Youthline" },
    phone: "0800 376 633",
    hours: "24/7",
    audience: "youth",
    source: "https://www.youthline.co.nz/",
  }),
  line({
    id: "sg-sos",
    country: "SG",
    name: { vi: "Samaritans of Singapore", en: "Samaritans of Singapore" },
    phone: "1767",
    hours: "24/7",
    audience: "all",
    source: "https://www.sos.org.sg/wp-content/uploads/2025/09/SOS-Services-Overview.pdf",
  }),
  line({
    id: "sg-mindline",
    country: "SG",
    name: { vi: "National mindline 1771", en: "National mindline 1771" },
    phone: "1771",
    hours: "24/7",
    audience: "all",
    source: "https://www.moh.gov.sg/newsroom/national-mindline-1771-to-provide--round-the-clock-support-for-mental-health/",
  }),
  line({
    id: "my-befrienders",
    country: "MY",
    name: { vi: "Befrienders Kuala Lumpur", en: "Befrienders Kuala Lumpur" },
    phone: "03-7627 2929",
    hours: "24/7",
    audience: "all",
    source: "https://www.befrienders.org.my/",
  }),
  line({
    id: "my-heal",
    country: "MY",
    name: { vi: "Talian HEAL 15555", en: "HEAL Line 15555 (Ministry of Health)" },
    phone: "15555",
    hours: { tz: "Asia/Kuala_Lumpur", open: "08:00", close: "00:00" },
    audience: "all",
    source: "https://www.utusan.com.my/berita/2022/10/talian-kesihatan-mental-heal-15555-mula-beroperasi-hari-ini/",
  }),
  line({
    id: "ph-ncmh",
    country: "PH",
    name: { vi: "NCMH Crisis Hotline", en: "NCMH Crisis Hotline" },
    phone: "1553",
    hours: "24/7",
    audience: "all",
    source: "https://tribune.net.ph/2026/01/03/doh-mental-health-hotline-gets-nearly-1k-calls-during-holiday-season",
  }),
  line({
    id: "id-healing119",
    country: "ID",
    name: { vi: "Healing119 (Bộ Y tế Indonesia)", en: "Healing119 (Ministry of Health)" },
    phone: "119 ext. 8",
    hours: "24/7",
    audience: "all",
    source: "https://healing119.id/",
  }),
  line({
    id: "in-tele-manas",
    country: "IN",
    name: { vi: "Tele-MANAS", en: "Tele-MANAS (national mental health line)" },
    phone: "14416",
    hours: "24/7",
    audience: "all",
    source: "https://telemanas.mohfw.gov.in/",
  }),
];

export const COUNTRY_NAMES: Record<string, Record<Locale, string>> = {
  VN: { vi: "Việt Nam", en: "Vietnam" },
  US: { vi: "Hoa Kỳ", en: "United States" },
  CA: { vi: "Canada", en: "Canada" },
  GB: { vi: "Vương quốc Anh", en: "United Kingdom" },
  IE: { vi: "Ireland", en: "Ireland" },
  AU: { vi: "Úc", en: "Australia" },
  NZ: { vi: "New Zealand", en: "New Zealand" },
  SG: { vi: "Singapore", en: "Singapore" },
  MY: { vi: "Malaysia", en: "Malaysia" },
  PH: { vi: "Philippines", en: "Philippines" },
  ID: { vi: "Indonesia", en: "Indonesia" },
  IN: { vi: "Ấn Độ", en: "India" },
};

/** The person's own country's lines (in listed order) and everyone else's. */
export function linesFor(country: string | null): { home: Hotline[]; others: Hotline[] } {
  const home = country ? HOTLINES.filter((h) => h.country === country) : [];
  return { home, others: HOTLINES.filter((h) => h.country !== country) };
}

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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function weekdayIn(tz: string, now: Date): number {
  return WEEKDAYS.indexOf(new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(now));
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Whether the line is answering right now, in its own time zone (handles overnight hours). */
export function isOpenNow(line: Hotline, now: Date): boolean {
  if (line.hours === "24/7") return true;
  if (line.hours.days && !line.hours.days.includes(weekdayIn(line.hours.tz, now))) return false;
  const current = minutesIn(line.hours.tz, now);
  const open = toMinutes(line.hours.open);
  const close = toMinutes(line.hours.close);
  return open <= close ? current >= open && current < close : current >= open || current < close;
}

/** A dialable link: spaces and dashes dropped; "ext. 8" becomes a pause then 8. */
export function telHref(phone: string) {
  return `tel:${phone.replace(/\s*ext\.?\s*/i, ",").replace(/[\s-]+/g, "")}`;
}
