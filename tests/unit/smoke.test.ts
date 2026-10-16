import { describe, expect, it } from "vitest";

describe("test environment", () => {
  it("provides IndexedDB in jsdom", () => {
    expect(typeof indexedDB.open).toBe("function");
  });

  it("provides jest-dom matchers", () => {
    const el = document.createElement("div");
    document.body.append(el);
    expect(el).toBeInTheDocument();
  });
});
