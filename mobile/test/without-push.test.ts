import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { removePushEntitlement } = require("../plugins/without-push-entitlement.js") as {
  removePushEntitlement(e: Record<string, unknown>): Record<string, unknown>;
};

describe("without-push-entitlement plugin", () => {
  it("drops aps-environment and keeps everything else", () => {
    expect(removePushEntitlement({ "aps-environment": "development", "keychain-access-groups": ["x"] })).toEqual({
      "keychain-access-groups": ["x"],
    });
    expect(removePushEntitlement({})).toEqual({});
  });
});
