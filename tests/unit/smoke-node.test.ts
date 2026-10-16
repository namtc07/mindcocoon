// @vitest-environment node
import { expect, it } from "vitest";

it("provides WebCrypto subtle in node", () => {
  expect(crypto.subtle).toBeDefined();
});
