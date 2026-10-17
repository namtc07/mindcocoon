import { describe, expect, it } from "vitest";
import { isIdleTooLong } from "@mindcocoon/core/vault/session";

const unlocked = { hasPasscode: true, status: "unlocked" as const, autoLockMinutes: 5 };

describe("isIdleTooLong", () => {
  it("locks a passcode vault after the idle limit", () => {
    expect(isIdleTooLong(0, 6 * 60_000, unlocked)).toBe(true);
    expect(isIdleTooLong(0, 4 * 60_000, unlocked)).toBe(false);
  });

  it("never locks without a passcode or when already locked", () => {
    expect(isIdleTooLong(0, 60 * 60_000, { ...unlocked, hasPasscode: false })).toBe(false);
    expect(isIdleTooLong(0, 60 * 60_000, { ...unlocked, status: "locked" })).toBe(false);
  });
});
