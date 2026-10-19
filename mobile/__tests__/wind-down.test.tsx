import { addMood } from "@mindcocoon/core/mood/store";
import { getStorage } from "@mindcocoon/core/storage/index";
import { act, fireEvent, screen, userEvent, waitFor } from "@testing-library/react-native";
import { setAudioModeAsync } from "expo-audio";
import WindDownScreen from "@/app/wind-down";
import { audio } from "@/lib/audio";
import { setPref } from "@/lib/prefs";
import { renderWithApp } from "@/test-utils/render";

async function open(existing?: "heavy") {
  await renderWithApp(<></>);
  await act(async () => {
    audio.reset();
    await setPref("breathing", undefined);
    if (existing) await addMood({ mood: existing, tags: [] });
  });
  const user = userEvent.setup();
  const view = await renderWithApp(<WindDownScreen />, { keepState: true });
  return { user, view };
}

afterEach(async () => {
  await act(async () => audio.reset());
});

describe("Wind down", () => {
  it("saves the check-in, then Goodnight plays the matching mix with a 30-minute timer", async () => {
    const { user } = await open();
    await user.press(await screen.findByRole("radio", { name: "Anxious" }));
    await user.press(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("Breathe")).toBeOnTheScreen();
    expect(screen.getByText(/In 4 · out 6/)).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: "Rain at sea" })).toBeSelected();
    expect(screen.getByRole("button", { name: "30 min" })).toBeSelected();
    expect(audio.getState().playing).toEqual([]);
    await user.press(screen.getByRole("button", { name: "Goodnight" }));
    await waitFor(() => expect([...audio.getState().playing].sort()).toEqual(["night-wind", "ocean", "rain"]));
    expect(audio.getState().sleepMinutes).toBe(30);
    expect(await screen.findByText("Sleep well.")).toBeOnTheScreen();
    expect((await getStorage().moods.list()).map((l) => l.mood)).toEqual(["anxious"]);
  });

  it("skipping the check-in uses Rainy night", async () => {
    const { user } = await open();
    await user.press(await screen.findByRole("button", { name: "Skip" }));
    await user.press(screen.getByRole("button", { name: "Skip" }));
    expect(screen.getByRole("button", { name: "Rainy night" })).toBeSelected();
    expect(await getStorage().moods.list()).toEqual([]);
  });

  it("an existing check-in today isn't duplicated", async () => {
    const { user } = await open("heavy");
    expect(await screen.findByRole("radio", { name: "Heavy" })).toBeChecked();
    await user.press(screen.getByRole("button", { name: "Next" }));
    await user.press(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: "Rainy night" })).toBeSelected();
    expect(await getStorage().moods.list()).toHaveLength(1);
  });

  it("leaving before Goodnight plays nothing", async () => {
    const { user, view } = await open();
    await user.press(await screen.findByRole("button", { name: "Skip" }));
    await user.press(screen.getByRole("button", { name: "Skip" }));
    await user.press(screen.getByRole("button", { name: "60 min" }));
    await view.unmount();
    expect(audio.getState().playing).toEqual([]);
    expect(audio.getState().sleepEndsAt).toBeNull();
  });

  it("two quick mood taps make one check-in with the last mood", async () => {
    await open();
    const heavy = await screen.findByRole("radio", { name: "Heavy" });
    const anxious = screen.getByRole("radio", { name: "Anxious" });
    await act(async () => {
      fireEvent.press(heavy);
      fireEvent.press(anxious);
    });
    await waitFor(async () => expect((await getStorage().moods.list()).map((l) => l.mood)).toEqual(["anxious"]));
  });

  it("the night screen shows what's playing and can stop it", async () => {
    const { user } = await open();
    await user.press(await screen.findByRole("button", { name: "Skip" }));
    await user.press(screen.getByRole("button", { name: "Skip" }));
    await user.press(screen.getByRole("button", { name: "Goodnight" }));
    expect(await screen.findByLabelText("Now playing")).toBeOnTheScreen();
    expect(screen.getByLabelText("Sleep timer: 30 min")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Stop all" }));
    expect(audio.getState().playing).toEqual([]);
    expect(setAudioModeAsync).toBeDefined();
  });
});
