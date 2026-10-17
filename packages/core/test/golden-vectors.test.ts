// @vitest-environment node
import { describe, expect, it } from "vitest";
import { decryptString, fromBase64, importDek } from "@mindcocoon/core/crypto";
import { unlockWithRecoveryCode } from "@mindcocoon/core/vault/keyring";
import vectors from "./golden-vectors.json";

/**
 * Pinned encryption formats. Journals written by any build (web or mobile) must
 * stay readable forever — if one of these fails, a format changed.
 * Vectors were generated with Node WebCrypto (see M1 plan, Task 2).
 */
describe("golden crypto vectors", () => {
  it("PBKDF2-SHA256 310000 iterations derives the pinned bits", async () => {
    const material = await crypto.subtle.importKey("raw", new TextEncoder().encode("2468"), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: fromBase64(vectors.saltB64), iterations: 310_000, hash: "SHA-256" },
      material,
      256,
    );
    expect(Buffer.from(bits).toString("hex")).toBe(vectors.pbkdf2Hex);
  });

  it("opens a pinned v1 envelope with the data key", async () => {
    const dek = await importDek(fromBase64(vectors.dekB64));
    expect(await decryptString(dek, vectors.envelope)).toBe("golden");
  });

  it("opens a pinned recovery wrap with the 12 words", async () => {
    const unlocked = await unlockWithRecoveryCode(
      { version: 1, recovery: vectors.recovery, autoLockMinutes: 5 },
      `  ${vectors.recoveryCode.toUpperCase()} `,
    );
    expect(unlocked).not.toBeNull();
    expect(Buffer.from(unlocked!.raw).toString("base64")).toBe(vectors.dekB64);
  });
});
