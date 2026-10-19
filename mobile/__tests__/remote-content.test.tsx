import { parseRemoteContent } from "@mindcocoon/core/remote-content";
import { act, screen, userEvent } from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";
import VentScreen from "@/app/(tabs)/vent";
import SanctuaryScreen from "@/app/(tabs)/sanctuary";
import PracticeScreen from "@/app/practices/[id]";
import PromptsScreen from "@/app/prompts";
import StoryScreen from "@/app/stories/[id]";
import { setPref } from "@/lib/prefs";
import { remoteContent } from "@/lib/remote-content";
import { renderWithApp } from "@/test-utils/render";

const recent = new Date(Date.now() - 2 * 24 * 3600_000).toISOString();
const ROWS = [
  { id: "p1", kind: "prompt", locale: "en", body: { text: "What can wait until tomorrow?" }, created_at: recent },
  {
    id: "s1",
    kind: "story",
    locale: "en",
    body: { title: "The quiet harbour", summary: "Boats knocking softly in the dark.", minutes: 4, paragraphs: ["The harbour is quiet tonight, and the boats rock slowly.", "A rope creaks. Somewhere a bell rings once."] },
    created_at: recent,
  },
  {
    id: "x1",
    kind: "practice",
    locale: "en",
    body: { title: "Two-minute reset", summary: "A short pause.", minutes: 2, steps: [{ text: "Let your shoulders drop." }, { text: "Breathe out slowly." }] },
    created_at: recent,
  },
];

beforeEach(async () => {
  jest.clearAllMocks();
  (useLocalSearchParams as jest.Mock).mockReturnValue({});
  await renderWithApp(<></>);
  await act(async () => {
    await setPref("remoteContent", { value: parseRemoteContent(ROWS), fetchedAt: Date.now() });
    await setPref("sanctuaryTab", "practices");
    remoteContent.reload();
  });
});

afterAll(async () => {
  await act(async () => {
    await setPref("remoteContent", undefined);
    await setPref("sanctuaryTab", undefined);
    remoteContent.reload();
  });
});

describe("Content published after this version", () => {
  it("new writing ideas lead the library, marked New, and open in Vent", async () => {
    const user = userEvent.setup();
    await renderWithApp(<PromptsScreen />, { keepState: true });
    expect(screen.getByText("New")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: /What can wait until tomorrow\?/ }));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/vent", params: { remotePrompt: "0" } });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ remotePrompt: "0" });
    await renderWithApp(<VentScreen />, { keepState: true });
    expect(screen.getByText("What can wait until tomorrow?")).toBeOnTheScreen();
  });

  it("a new story shows in Sanctuary, marked New, and can be read aloud", async () => {
    const user = userEvent.setup();
    await renderWithApp(<SanctuaryScreen />, { keepState: true });
    const link = screen.getByRole("link", { name: /The quiet harbour/ });
    expect(link).toHaveAccessibleName(/New/);
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "r-s1" });
    await renderWithApp(<StoryScreen />, { keepState: true });
    expect(screen.getByText("A rope creaks. Somewhere a bell rings once.")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Read to me" }));
  });

  it("a new practice shows in the list and runs like the others", async () => {
    await renderWithApp(<SanctuaryScreen />, { keepState: true });
    expect(screen.getByRole("button", { name: /Two-minute reset/ })).toBeOnTheScreen();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "r-x1" });
    await renderWithApp(<PracticeScreen />, { keepState: true });
    expect(screen.getByText("Let your shoulders drop.")).toBeOnTheScreen();
  });
});
