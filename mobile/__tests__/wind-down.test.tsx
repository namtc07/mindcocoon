import { addMood } from "@mindcocoon/core/mood/store";
import { getStorage } from "@mindcocoon/core/storage/index";
import { tonightPlan } from "@mindcocoon/core/tonight-plan";
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
    await setPref("tonightSeed", "wind-down-test");
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
    expect(await getStorage().moods.list()).toEqual([]);
    await user.press(screen.getByRole("button", { name: "Save and continue" }));
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
    expect(screen.getByTestId("ken-sleepy", { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.getByTestId("scene-rain-sea", { includeHiddenElements: true })).toBeOnTheScreen();
    expect((await getStorage().moods.list()).map((l) => l.mood)).toEqual(["anxious"]);
  });

  it("skipping the check-in uses tonight's planned mix", async () => {
    const { user } = await open();
    const presetNames = { "rainy-night": "Rainy night", "by-the-fire": "By the fire", "sea-breeze": "Sea breeze", "rain-at-sea": "Rain at sea" } as const;
    const expected = presetNames[tonightPlan("wind-down-test", new Date()).mix];
    await user.press(await screen.findByRole("button", { name: "Skip" }));
    await user.press(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: expected })).toBeSelected();
    expect(await getStorage().moods.list()).toEqual([]);
  });

  it("an existing check-in today isn't duplicated", async () => {
    const { user } = await open("heavy");
    expect(await screen.findByRole("radio", { name: "Heavy" })).toBeChecked();
    await user.press(screen.getByRole("button", { name: "Save and continue" }));
    await user.press(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: "Rainy night" })).toBeSelected();
    expect(await getStorage().moods.list()).toHaveLength(1);
  });

  it("choosing a different mood in the evening adds a new moment, keeping the earlier one", async () => {
    const { user } = await open("heavy");
    await user.press(await screen.findByRole("radio", { name: "Anxious" }));
    await user.press(screen.getByRole("button", { name: "Save and continue" }));
    await waitFor(async () =>
      expect((await getStorage().moods.list()).map((l) => l.mood).sort()).toEqual(["anxious", "heavy"]),
    );
  });

  it("leaving before Goodnight plays nothing", async () => {
    const { user, view } = await open();
    await user.press(await screen.findByRole("button", { name: "Skip" }));
    await user.press(screen.getByRole("button", { name: "Next" }));
    await user.press(screen.getByRole("button", { name: "60 min" }));
    await view.unmount();
    expect(audio.getState().playing).toEqual([]);
    expect(audio.getState().sleepEndsAt).toBeNull();
  });

  it("several taps before saving make one check-in with the last mood", async () => {
    const { user } = await open();
    await user.press(await screen.findByRole("radio", { name: "Heavy" }));
    await user.press(screen.getByRole("radio", { name: "Anxious" }));
    expect(await getStorage().moods.list()).toEqual([]);
    await user.press(screen.getByRole("button", { name: "Save and continue" }));
    await waitFor(async () => expect((await getStorage().moods.list()).map((l) => l.mood)).toEqual(["anxious"]));
  });

  it("Cancel lets the choice go; Skip then moves on without saving", async () => {
    const { user } = await open();
    await user.press(await screen.findByRole("radio", { name: "Heavy" }));
    await user.press(screen.getByRole("button", { name: "sad" }));
    await user.press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("radio", { name: "Heavy" })).not.toBeChecked();
    await user.press(screen.getByRole("button", { name: "Skip" }));
    expect(await screen.findByText("Breathe")).toBeOnTheScreen();
    expect(await getStorage().moods.list()).toEqual([]);
  });

  it("with today's check-in already there, Cancel clears it from the picker so Skip is offered", async () => {
    const { user } = await open("heavy");
    expect(await screen.findByRole("radio", { name: "Heavy" })).toBeChecked();
    await user.press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("radio", { name: "Heavy" })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Skip" })).toBeOnTheScreen();
    expect(await getStorage().moods.list()).toHaveLength(1);
  });

  it("feeling words chosen here are saved with the check-in", async () => {
    const { user } = await open();
    await user.press(await screen.findByRole("radio", { name: "Lonely" }));
    await user.press(screen.getByRole("button", { name: "longing" }));
    await user.press(screen.getByRole("button", { name: "Save and continue" }));
    await waitFor(async () => expect((await getStorage().moods.list())[0]).toMatchObject({ mood: "alone", feelings: ["longing"] }));
  });

  it("the night screen shows what's playing and can stop it", async () => {
    const { user } = await open();
    await user.press(await screen.findByRole("button", { name: "Skip" }));
    await user.press(screen.getByRole("button", { name: "Next" }));
    await user.press(screen.getByRole("button", { name: "Goodnight" }));
    expect(await screen.findByLabelText("Now playing")).toBeOnTheScreen();
    expect(screen.getByLabelText("Sleep timer: 30 min")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Stop all" }));
    expect(audio.getState().playing).toEqual([]);
    expect(setAudioModeAsync).toBeDefined();
  });
});
