import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const assets = join(__dirname, "..", "assets");
const EXPO_DEFAULT_ICON_MD5 = "cb975bba2216ce10a60e6c0ffe9941a2";

/** Width and height from a PNG's IHDR chunk. */
function pngSize(file: string) {
  const buf = readFileSync(join(assets, file));
  expect(buf.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe("brand assets", () => {
  it("uses our own app icon, not Expo's placeholder", () => {
    const md5 = createHash("md5").update(readFileSync(join(assets, "icon.png"))).digest("hex");
    expect(md5).not.toBe(EXPO_DEFAULT_ICON_MD5);
  });

  it.each(["icon.png", "splash-icon.png", "android-icon-foreground.png", "android-icon-background.png", "android-icon-monochrome.png"])(
    "%s is a 1024 × 1024 PNG",
    (file) => {
      expect(pngSize(file)).toEqual({ width: 1024, height: 1024 });
    },
  );

  it("app.json points at the generated files", () => {
    const app = JSON.parse(readFileSync(join(__dirname, "..", "app.json"), "utf8")).expo;
    expect(app.icon).toBe("./assets/icon.png");
    expect(app.android.adaptiveIcon.foregroundImage).toBe("./assets/android-icon-foreground.png");
    expect(JSON.stringify(app.plugins)).toContain("./assets/splash-icon.png");
  });
});

describe("brand generator", () => {
  it("pins sharp so the icons render the same everywhere", () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, "..", "..", "package.json"), "utf8"));
    expect(pkg.devDependencies.sharp).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
