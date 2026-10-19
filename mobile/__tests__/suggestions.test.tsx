import { addMood } from "@mindcocoon/core/mood/store";
import { act, screen, userEvent, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import { SuggestionCard } from "@/components/today/SuggestionCard";
import { ToastHost } from "@/components/ui/Toast";
import { audio } from "@/lib/audio";
import { getPref, setPref } from "@/lib/prefs";
import { renderWithApp } from "@/test-utils/render";

async function withMood(mood: "anxious" | "heavy" | null) {
  await renderWithApp(<></>);
  await act(async () => {
    audio.reset();
    await setPref("suggestHiddenOn", undefined);
    await setPref("breathing", undefined);
    if (mood) await addMood({ mood, tags: [] });
  });
  const user = userEvent.setup();
  await renderWithApp(
    <>
      <SuggestionCard now={new Date()} />
      <ToastHost />
    </>,
    { keepState: true },
  );
  return user;
}

afterEach(() => jest.clearAllMocks());

describe("Suggestions after a check-in", () => {
  it("anxious shows slow exhale, Rain at sea and grounding", async () => {
    await withMood("anxious");
    expect(await screen.findByText("Something for this feeling")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Breathe: Slow exhale · 3 min" })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Listen: Rain at sea" })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Try: 5-4-3-2-1 grounding" })).toBeOnTheScreen();
  });

  it("breathe opens Sanctuary with that rhythm selected", async () => {
    const user = await withMood("heavy");
    await user.press(await screen.findByRole("button", { name: "Breathe: 4-7-8 · 3 min" }));
    expect(getPref("breathing")).toEqual({ pattern: "relax", minutes: 3 });
    expect(router.push).toHaveBeenCalledWith({ pathname: "/sanctuary", params: { section: "breathe" } });
  });

  it("play starts the mix", async () => {
    const user = await withMood("anxious");
    await user.press(await screen.findByRole("button", { name: "Listen: Rain at sea" }));
    await waitFor(() => expect([...audio.getState().playing].sort()).toEqual(["night-wind", "ocean", "rain"]));
    expect(await screen.findByText("Playing Rain at sea")).toBeOnTheScreen();
  });

  it("practice opens it", async () => {
    const user = await withMood("heavy");
    await user.press(await screen.findByRole("button", { name: "Try: A kind letter to yourself" }));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/practices/[id]", params: { id: "kind-letter" } });
  });

  it("not now hides it until tomorrow", async () => {
    const user = await withMood("anxious");
    await user.press(await screen.findByRole("button", { name: "Not now" }));
    expect(screen.queryByText("Something for this feeling")).not.toBeOnTheScreen();
    expect(getPref("suggestHiddenOn")).toBeTruthy();
  });

  it("no card before checking in", async () => {
    await withMood(null);
    expect(screen.queryByText("Something for this feeling")).not.toBeOnTheScreen();
  });
});
