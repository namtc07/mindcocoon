import { expect, it } from "vitest";
import { CORE_VERSION } from "@mindcocoon/core/version";

it("resolves the shared core package", () => {
  expect(CORE_VERSION).toBe("0.1.0");
});
