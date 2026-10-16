import { describe, expect, it } from "vitest";
import { checkText, normalizeForMatch } from "@/lib/safety/detect";
import { HOTLINES, isOpenNow, type Hotline } from "@/lib/safety/hotlines";

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
    "",
  ])("does not flag %j", (text) => {
    expect(checkText(text).flagged).toBe(false);
  });
});

describe("hotlines", () => {
  const line: Hotline = {
    id: "test",
    country: "VN",
    name: { vi: "Thử", en: "Test" },
    phone: "000",
    hours: { tz: "Asia/Ho_Chi_Minh", open: "08:00", close: "22:00" },
    audience: "all",
    verified: false,
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

  it("include an emergency number and a youth line for Vietnam", () => {
    expect(HOTLINES.some((h) => h.country === "VN" && h.phone === "115")).toBe(true);
    expect(HOTLINES.some((h) => h.country === "VN" && h.audience === "youth")).toBe(true);
  });
});
