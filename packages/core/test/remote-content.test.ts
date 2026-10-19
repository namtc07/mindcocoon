import { describe, expect, it } from "vitest";
import { EMPTY_CONTENT, parseRemoteContent } from "@mindcocoon/core/remote-content";

const story = {
  title: "The quiet harbour",
  summary: "Boats knocking softly in the dark.",
  minutes: 4,
  paragraphs: ["The harbour is quiet tonight, and the boats rock slowly on the black water.", "A rope creaks. Somewhere a bell rings once."],
};

describe("remote content", () => {
  it("reads published prompts, stories and practices per language", () => {
    const content = parseRemoteContent([
      { id: "p1", kind: "prompt", locale: "en", body: { text: "What's one thing you can let wait until tomorrow?" }, created_at: "2026-10-18T00:00:00Z" },
      { id: "s1", kind: "story", locale: "vi", body: story, created_at: "2026-10-18T00:00:00Z" },
      {
        id: "x1",
        kind: "practice",
        locale: "en",
        body: { title: "Two-minute reset", summary: "A short pause.", minutes: 2, steps: [{ text: "Breathe out slowly." }, { text: "Name one thing you can see.", seconds: 20 }] },
        created_at: "2026-10-18T00:00:00Z",
      },
    ]);
    expect(content.prompts.en).toEqual([{ text: "What's one thing you can let wait until tomorrow?", addedAt: "2026-10-18T00:00:00Z" }]);
    expect(content.stories.vi[0]).toMatchObject({ id: "r-s1", title: "The quiet harbour", addedAt: "2026-10-18T00:00:00Z" });
    expect(content.practices.en[0]).toMatchObject({ id: "r-x1", minutes: 2 });
    expect(content.stories.en).toEqual([]);
  });

  it("drops anything malformed, oversized or in an unknown language — one bad row never spoils the rest", () => {
    const content = parseRemoteContent([
      { id: "bad1", kind: "prompt", locale: "en", body: { text: "" } },
      { id: "bad2", kind: "prompt", locale: "fr", body: { text: "Bonjour" } },
      { id: "bad3", kind: "story", locale: "en", body: { ...story, paragraphs: [] } },
      { id: "bad4", kind: "story", locale: "en", body: { ...story, paragraphs: ["x".repeat(2000)] } },
      { id: "bad5", kind: "practice", locale: "en", body: { title: "T", summary: "S", minutes: 2, steps: [{ text: "ok", input: "essay" }] } },
      { id: "bad6", kind: "song", locale: "en", body: {} },
      { id: "ok", kind: "prompt", locale: "en", body: { text: "How was the light today?" } },
      null,
      42,
    ]);
    expect(content.prompts.en.map((p) => p.text)).toEqual(["How was the light today?"]);
    expect(content.stories.en).toEqual([]);
    expect(content.practices.en).toEqual([]);
  });

  it("garbage in, nothing out", () => {
    expect(parseRemoteContent("oops")).toEqual(EMPTY_CONTENT);
  });
});
