import { describe, expect, it } from "vitest";
import { LOCALES } from "@mindcocoon/core/i18n/config";
import { checkText, normalizeForMatch } from "@mindcocoon/core/safety/detect";
import { COUNTRY_NAMES, HOTLINES, isOpenNow, linesFor, type Hotline } from "@mindcocoon/core/safety/hotlines";

describe("normalizeForMatch", () => {
  it("strips Vietnamese diacritics and case", () => {
    expect(normalizeForMatch("  Tôi KHÔNG muốn   sống nữa ")).toBe("toi khong muon song nua");
    expect(normalizeForMatch("Đường")).toBe("duong");
  });
});

describe("checkText", () => {
  it.each([
    "tôi không muốn sống nữa",
    "khong muon song nua",
    "muốn chết đi cho rồi",
    "mình đang nghĩ đến chuyện tự tử",
    "muon tu tu",
    "I want to kill myself",
    "i dont want to live anymore",
    "Sometimes I think about ending my life.",
    "ko muốn sống nữa",
    "k muốn sống nữa",
    "hong muon song nua",
    "chán sống quá",
    "không thiết sống nữa",
    "tôi muốn tự làm đau mình",
    "lại rạch tay rồi",
    "I wanna die",
    "i want to end it all",
    "honestly kms",
  ])("flags %j", (text) => {
    expect(checkText(text).flagged).toBe(true);
  });

  it.each([
    "cười muốn chết",
    "mệt muốn chết",
    "giết thời gian bằng cách xem phim",
    "this traffic is killing me",
    "chết rồi, quên mang ví",
    "từ từ thôi",
    "hôm nay mình mệt quá",
    "chán quá, sống ở thành phố này",
    "k muốn đi học",
    "",
  ])("does not flag %j", (text) => {
    expect(checkText(text).flagged).toBe(false);
  });
});

describe("hotlines", () => {
  const line: Hotline = {
    id: "test",
    country: "VN",
    name: { vi: "Thử", en: "Test", id: "Uji" },
    phone: "000",
    hours: { tz: "Asia/Ho_Chi_Minh", open: "08:00", close: "22:00" },
    audience: "all",
    verified: false,
    source: "https://example.org",
    checkedOn: "2026-10-19",
  };

  it("knows whether a line is open in its own time zone", () => {
    // 21:59 and 22:00 in Ho Chi Minh City (UTC+7).
    expect(isOpenNow(line, new Date("2026-10-16T14:59:00Z"))).toBe(true);
    expect(isOpenNow(line, new Date("2026-10-16T15:00:00Z"))).toBe(false);
    expect(isOpenNow(line, new Date("2026-10-16T00:59:00Z"))).toBe(false);
  });

  it("treats 24/7 lines as always open", () => {
    expect(isOpenNow({ ...line, hours: "24/7" }, new Date())).toBe(true);
  });

  it("honours open days (Ngày Mai answers Wednesday to Sunday only)", () => {
    const ngayMai = HOTLINES.find((h) => h.id === "vn-ngay-mai")!;
    // Tue 20 Oct 2026, 15:00 in Vietnam → closed; Wed 21 Oct 15:00 → open; Wed 21:00 → closed.
    expect(isOpenNow(ngayMai, new Date("2026-10-20T08:00:00Z"))).toBe(false);
    expect(isOpenNow(ngayMai, new Date("2026-10-21T08:00:00Z"))).toBe(true);
    expect(isOpenNow(ngayMai, new Date("2026-10-21T14:00:00Z"))).toBe(false);
  });

  it("covers the countries we serve, each line with where and when it was checked", () => {
    for (const country of ["VN", "US", "CA", "GB", "IE", "AU", "NZ", "SG", "MY", "PH", "ID", "IN"]) {
      expect(HOTLINES.some((h) => h.country === country), country).toBe(true);
      for (const locale of LOCALES) expect(COUNTRY_NAMES[country]?.[locale], `${country} ${locale}`).toBeTruthy();
    }
    for (const h of HOTLINES) for (const locale of LOCALES) expect(h.name[locale]?.trim(), `${h.id} ${locale}`).toBeTruthy();
    for (const h of HOTLINES) {
      expect(h.source, h.id).toMatch(/^https:\/\//);
      expect(h.checkedOn, h.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("puts a country's own lines first", () => {
    expect(linesFor("PH").home.map((h) => h.id)).toEqual(["ph-ncmh"]);
    expect(linesFor("PH").others.some((h) => h.country === "PH")).toBe(false);
    expect(linesFor("FR").home).toEqual([]);
    expect(linesFor(null).home).toEqual([]);
  });

  it("include an emergency number and a youth line for Vietnam", () => {
    expect(HOTLINES.some((h) => h.country === "VN" && h.phone === "115")).toBe(true);
    expect(HOTLINES.some((h) => h.country === "VN" && h.audience === "youth")).toBe(true);
  });
});
