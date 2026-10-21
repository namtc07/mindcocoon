import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { addWidgetAppGroup, WIDGET_APP_GROUP } = require("../plugins/with-tonight-widget.js") as {
  addWidgetAppGroup(e: Record<string, unknown>): Record<string, unknown>;
  WIDGET_APP_GROUP: string;
};

describe("with-tonight-widget plugin", () => {
  it("adds the widget app group and keeps everything else", () => {
    expect(addWidgetAppGroup({ "aps-environment": "development" })).toEqual({
      "aps-environment": "development",
      "com.apple.security.application-groups": [WIDGET_APP_GROUP],
    });
  });

  it("merges with existing groups without duplicating its own", () => {
    const once = addWidgetAppGroup({ "com.apple.security.application-groups": ["group.other"] });
    expect(once["com.apple.security.application-groups"]).toEqual(["group.other", WIDGET_APP_GROUP]);
    expect(addWidgetAppGroup(once)).toEqual(once);
  });
});
