import { pickTonightTrack } from "@mindcocoon/core/audio/tonight";
import { addMood } from "@mindcocoon/core/mood/store";
import { SOUND_TRACKS } from "@mindcocoon/core/sounds";
import { act, fireEvent, screen, userEvent, waitFor } from "@testing-library/react-native";
import { setAudioModeAsync } from "expo-audio";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { AccessibilityInfo, AppState, type AppStateStatus } from "react-native";
import SanctuaryScreen from "@/app/(tabs)/sanctuary";
import { BoxBreathing } from "@/components/sanctuary/BoxBreathing";
import { ToastHost } from "@/components/ui/Toast";
import { audio } from "@/lib/audio";
import { fakePlayer } from "@/test-utils/audio";
import { captureFocusEffects } from "@/test-utils/focus";
import { getPref, setPref } from "@/lib/prefs";
import { renderWithApp } from "@/test-utils/render";
import { createAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { BREATH_CUE_SOURCES } from "@/lib/breath-cues";

beforeEach(async () => {
  await act(async () => audio.reset());
});

describe("Sanctuary sounds", () => {
  // First in the file: the audio session is prepared once per module registry.
  it("a sound that fails to play shows a toast", async () => {
    const user = userEvent.setup();
    (setAudioModeAsync as jest.Mock).mockRejectedValueOnce(new Error("busy"));
    await renderWithApp(
      <>
        <SanctuaryScreen />
        <ToastHost />
      </>,
    );
    await user.press(await screen.findByRole("button", { name: "Play: Rain" }));
    expect(await screen.findByText("That sound couldn't play.")).toBeOnTheScreen();
    expect(audio.getState().playing).toEqual([]);
  });

  it("tapping Rain plays it and the button shows Pause", async () => {
    const user = userEvent.setup();
    await renderWithApp(<SanctuaryScreen />);
    await user.press(await screen.findByRole("button", { name: "Play: Rain" }));
    const pause = await screen.findByRole("button", { name: "Pause: Rain" });
    expect(pause).toBeSelected();
    expect(audio.getState().playing).toEqual(["rain"]);
    await user.press(pause);
    expect(await screen.findByRole("button", { name: "Play: Rain" })).toBeOnTheScreen();
  });

  it("moving a volume slider changes that track's volume", async () => {
    const user = userEvent.setup();
    await renderWithApp(<SanctuaryScreen />);
    await user.press(await screen.findByRole("button", { name: "Play: Rain" }));
    await act(async () => fireEvent(screen.getByLabelText("Volume for Rain"), "valueChange", 0.3));
    expect(audio.getState().volumes.rain).toBe(0.3);
    expect(fakePlayer("rain")?.volume).toBeCloseTo(0.3 * 0.8);
    await act(async () => fireEvent(screen.getByLabelText("Overall volume"), "valueChange", 0.5));
    expect(audio.getState().master).toBe(0.5);
  });

  it("loop switch turns looping off", async () => {
    await renderWithApp(<SanctuaryScreen />);
    const loop = await screen.findByRole("switch", { name: "Loop" });
    await act(async () => fireEvent(loop, "valueChange", false));
    expect(audio.getState().loop).toBe(false);
  });

  it("tonight's music follows today's check-in", async () => {
    const user = userEvent.setup();
    await renderWithApp(<></>);
    await act(async () => {
      await addMood({ mood: "heavy", tags: [] });
    });
    await renderWithApp(<SanctuaryScreen />, { keepState: true });
    const track = pickTonightTrack(SOUND_TRACKS, "heavy", new Date());
    expect(await screen.findByText("Chosen for feeling heavy")).toBeOnTheScreen();
    const names: Record<string, string> = {
      "piano-still": "Still",
      "piano-dawn": "Dawn",
      "lofi-rain": "Rain on the window",
      "lofi-slow": "Slow down",
      "piano-drift": "Drift",
      "piano-letter": "A letter",
    };
    await user.press(screen.getByRole("button", { name: `Play: ${names[track.id]}` }));
    expect(audio.getState().playing).toEqual([track.id]);
  });

  it("without a check-in today, tonight's music is a soft piece for tonight", async () => {
    await renderWithApp(<SanctuaryScreen />);
    expect(await screen.findByText("A soft piece for tonight")).toBeOnTheScreen();
  });
});

describe("Sleep timer", () => {
  it("choosing 20 min sets the sleep timer and shows Stops in 20 min", async () => {
    const user = userEvent.setup();
    await renderWithApp(<SanctuaryScreen />);
    await user.press(await screen.findByRole("button", { name: "20 min" }));
    expect(audio.getState().sleepEndsAt).not.toBeNull();
    expect(screen.getByRole("button", { name: "20 min" })).toBeSelected();
    expect(await screen.findByText("Stops in 20 min")).toBeOnTheScreen();
  });

  it("Off cancels it", async () => {
    const user = userEvent.setup();
    await renderWithApp(<SanctuaryScreen />);
    await user.press(await screen.findByRole("button", { name: "20 min" }));
    await user.press(screen.getByRole("button", { name: "Off" }));
    expect(audio.getState().sleepEndsAt).toBeNull();
    expect(screen.getByRole("button", { name: "Off" })).toBeSelected();
    await waitFor(() => expect(screen.queryByText(/Stops in/)).not.toBeOnTheScreen());
  });
});

describe("Box breathing", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  async function begin() {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderWithApp(<BoxBreathing />);
    await user.press(screen.getByRole("button", { name: "Begin" }));
    return user;
  }

  it("Begin shows Breathe in, then Hold after 4 seconds", async () => {
    await begin();
    expect(screen.getByText("Breathe in")).toBeOnTheScreen();
    await act(async () => jest.advanceTimersByTime(4_100));
    expect(screen.getByText("Hold")).toBeOnTheScreen();
    await act(async () => jest.advanceTimersByTime(4_000));
    expect(screen.getByText("Breathe out")).toBeOnTheScreen();
  });

  it("VoiceOver hears each phase", async () => {
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
    await begin();
    expect(announce).toHaveBeenLastCalledWith("Breathe in");
    await act(async () => jest.advanceTimersByTime(4_100));
    expect(announce).toHaveBeenLastCalledWith("Hold");
    await act(async () => jest.advanceTimersByTime(60_500));
    expect(announce).toHaveBeenLastCalledWith("Well done. Notice how you feel now.");
    announce.mockRestore();
  });

  it("finishes with the done message and Again", async () => {
    await begin();
    await act(async () => jest.advanceTimersByTime(64_500));
    expect(screen.getByText("Well done. Notice how you feel now.")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Again" })).toBeOnTheScreen();
  });

  it("Stop resets", async () => {
    const user = await begin();
    await user.press(screen.getByRole("button", { name: "Stop" }));
    expect(screen.getByRole("button", { name: "Begin" })).toBeOnTheScreen();
    expect(screen.queryByText("Breathe in")).not.toBeOnTheScreen();
  });

  it("keeps the screen awake only while breathing", async () => {
    await begin();
    expect(activateKeepAwakeAsync).toHaveBeenCalledWith("breathing");
    expect(deactivateKeepAwake).not.toHaveBeenCalled();
    await act(async () => jest.advanceTimersByTime(64_500));
    expect(deactivateKeepAwake).toHaveBeenCalledWith("breathing");
  });

  it("leaving the tab stops the exercise", async () => {
    const focus = captureFocusEffects();
    try {
      await begin();
      await act(async () => focus.blur());
      expect(screen.getByRole("button", { name: "Begin" })).toBeOnTheScreen();
      expect(deactivateKeepAwake).toHaveBeenCalledWith("breathing");
    } finally {
      focus.restore();
    }
  });

  it("the app going to background stops the exercise", async () => {
    let handler: ((s: AppStateStatus) => void) | undefined;
    // Swapped by hand: restoring a spy on the preset's jest.fn would drop its implementation.
    const original = AppState.addEventListener;
    AppState.addEventListener = ((_type: string, fn: (s: AppStateStatus) => void) => {
      handler = fn;
      return { remove: () => {} };
    }) as unknown as typeof AppState.addEventListener;
    await begin();
    const state = jest.replaceProperty(AppState, "currentState", "background");
    await act(async () => handler?.("background"));
    state.restore();
    await act(async () => handler?.("active"));
    expect(screen.getByRole("button", { name: "Begin" })).toBeOnTheScreen();
    AppState.addEventListener = original;
  });

  it("choosing 4-7-8 shows Hold for 7 seconds after Breathe in", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderWithApp(<BoxBreathing />);
    await user.press(screen.getByRole("button", { name: "4-7-8" }));
    await user.press(screen.getByRole("button", { name: "Begin" }));
    await act(async () => jest.advanceTimersByTime(4_100));
    expect(screen.getByText("Hold")).toBeOnTheScreen();
    expect(screen.getByText("7", { includeHiddenElements: true })).toBeOnTheScreen();
    await act(async () => jest.advanceTimersByTime(6_500));
    expect(screen.getByText("Hold")).toBeOnTheScreen();
    await act(async () => jest.advanceTimersByTime(1_000));
    expect(screen.getByText("Breathe out")).toBeOnTheScreen();
  });

  it("the chosen pattern and length are remembered", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderWithApp(<BoxBreathing />);
    await user.press(screen.getByRole("button", { name: "Slow exhale" }));
    await user.press(screen.getByRole("button", { name: "3 min" }));
    expect(getPref("breathing")).toEqual({ pattern: "calm", minutes: 3 });
    await renderWithApp(<BoxBreathing />, { keepState: true });
    expect(screen.getByRole("button", { name: "Slow exhale" })).toBeSelected();
    expect(screen.getByRole("button", { name: "3 min" })).toBeSelected();
    await act(() => setPref("breathing", undefined));
  });

  it("choices are locked while breathing", async () => {
    await begin();
    expect(screen.getByRole("button", { name: "4-7-8" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "5 min" })).toBeDisabled();
  });

  it("a 3-minute box session ends after 3 minutes, not 1", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderWithApp(<BoxBreathing />);
    await user.press(screen.getByRole("button", { name: "3 min" }));
    await user.press(screen.getByRole("button", { name: "Begin" }));
    await act(async () => jest.advanceTimersByTime(64_500));
    expect(screen.getByRole("button", { name: "Stop" })).toBeOnTheScreen();
    await act(async () => jest.advanceTimersByTime(180_000 - 64_500 + 500));
    expect(screen.getByText("Well done. Notice how you feel now.")).toBeOnTheScreen();
    await act(() => setPref("breathing", undefined));
  });

  it("changing the length after finishing starts fresh instead of resuming", async () => {
    const user = await begin();
    await act(async () => jest.advanceTimersByTime(64_500));
    expect(screen.getByRole("button", { name: "Again" })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "5 min" }));
    expect(screen.getByRole("button", { name: "Begin" })).toBeOnTheScreen();
    expect(screen.queryByText("Breathe in")).not.toBeOnTheScreen();
    await act(() => setPref("breathing", undefined));
  });

  it("is on the Sanctuary screen", async () => {
    const user = userEvent.setup();
    await renderWithApp(<SanctuaryScreen />);
    await user.press(screen.getByRole("tab", { name: "Breathe" }));
    expect(screen.getByRole("button", { name: "Begin" })).toBeOnTheScreen();
    await act(() => setPref("sanctuaryTab", undefined));
  });
});

describe("Mixes", () => {
  beforeEach(async () => {
    await act(async () => {
      audio.reset();
      await setPref("mixes", undefined);
      await setPref("unlocks", undefined);
    });
  });

  it("a preset starts its sounds", async () => {
    const user = userEvent.setup();
    await renderWithApp(<SanctuaryScreen />);
    await user.press(await screen.findByRole("button", { name: "Rainy night" }));
    await waitFor(() => expect([...audio.getState().playing].sort()).toEqual(["night-wind", "rain"]));
    expect(audio.getState().volumes.rain).toBe(0.7);
    expect(screen.getByRole("button", { name: "Rainy night" })).toBeSelected();
  });

  it('saving the current mix adds "My mix 1"', async () => {
    const user = userEvent.setup();
    await act(() => audio.play("ocean"));
    await renderWithApp(<SanctuaryScreen />);
    await user.press(await screen.findByRole("button", { name: "Save this mix" }));
    expect(await screen.findByRole("button", { name: "My mix 1" })).toBeSelected();
    expect(getPref("mixes")).toHaveLength(1);
    expect(getPref("mixes")?.[0].mix.volumes).toEqual({ ocean: 0.6 });
  });

  it("nothing to save when nothing plays", async () => {
    await renderWithApp(<SanctuaryScreen />);
    await screen.findByRole("button", { name: "Rainy night" });
    expect(screen.queryByRole("button", { name: "Save this mix" })).not.toBeOnTheScreen();
  });

  it("a sixth mix can't be saved", async () => {
    const saved = [1, 2, 3, 4, 5].map((n) => ({ id: `m${n}`, n, mix: { volumes: { rain: 0.1 * n } }, createdAt: "2026-10-18T00:00:00.000Z" }));
    await act(async () => {
      await setPref("mixes", saved);
      await audio.play("ocean");
    });
    await renderWithApp(<SanctuaryScreen />);
    expect(await screen.findByRole("button", { name: "Save this mix" })).toBeDisabled();
    expect(screen.getByText("You can keep up to 5 mixes. Remove one first.")).toBeOnTheScreen();
  });

  it("removing a saved mix", async () => {
    const user = userEvent.setup();
    await act(() => setPref("mixes", [{ id: "a", n: 1, mix: { volumes: { rain: 0.5 } }, createdAt: "2026-10-18T00:00:00.000Z" }]));
    await renderWithApp(<SanctuaryScreen />);
    await user.press(await screen.findByRole("button", { name: "Remove My mix 1" }));
    expect(screen.queryByRole("button", { name: "My mix 1" })).not.toBeOnTheScreen();
    expect(getPref("mixes")).toEqual([]);
  });

  it("a saved mix with a now-locked premium sound plays the rest", async () => {
    const user = userEvent.setup();
    await act(() => setPref("mixes", [{ id: "a", n: 1, mix: { volumes: { rain: 0.5, thunder: 0.5 } }, createdAt: "2026-10-18T00:00:00.000Z" }]));
    await renderWithApp(<SanctuaryScreen />);
    await user.press(await screen.findByRole("button", { name: "My mix 1" }));
    await waitFor(() => expect(audio.getState().playing).toEqual(["rain"]));
  });
});

describe("Breathing cues", () => {
  const cueCalls = () =>
    (createAudioPlayer as jest.Mock).mock.calls.map(([src]) => src).filter((src) => Object.values(BREATH_CUE_SOURCES).includes(src));

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });
  afterEach(async () => {
    jest.useRealTimers();
    await act(() => setPref("breathCues", undefined));
  });

  it("a cue on each phase change", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderWithApp(<BoxBreathing />);
    await user.press(screen.getByRole("button", { name: "Begin" }));
    await act(async () => jest.advanceTimersByTime(300));
    expect(cueCalls()).toEqual([BREATH_CUE_SOURCES.inhale]);
    await act(async () => jest.advanceTimersByTime(4_000));
    await act(async () => jest.advanceTimersByTime(4_000));
    expect(cueCalls()).toEqual([BREATH_CUE_SOURCES.inhale, BREATH_CUE_SOURCES.hold, BREATH_CUE_SOURCES.exhale]);
    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  it("no cues when off", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderWithApp(<BoxBreathing />);
    await user.press(screen.getByRole("button", { name: "Sound & touch cues" }));
    expect(getPref("breathCues")).toBe(false);
    await user.press(screen.getByRole("button", { name: "Begin" }));
    await act(async () => jest.advanceTimersByTime(9_000));
    expect(cueCalls()).toEqual([]);
  });

  it("no cue after stop", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderWithApp(<BoxBreathing />);
    await user.press(screen.getByRole("button", { name: "Begin" }));
    await act(async () => jest.advanceTimersByTime(300));
    await user.press(screen.getByRole("button", { name: "Stop" }));
    const before = cueCalls().length;
    await act(async () => jest.advanceTimersByTime(9_000));
    expect(cueCalls().length).toBe(before);
  });

  it("cues can be turned off mid-session", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderWithApp(<BoxBreathing />);
    await user.press(screen.getByRole("button", { name: "Begin" }));
    await act(async () => jest.advanceTimersByTime(300));
    const cue = screen.getByRole("button", { name: "Sound & touch cues" });
    expect(cue).toBeEnabled();
    await user.press(cue);
    const before = cueCalls().length;
    await act(async () => jest.advanceTimersByTime(9_000));
    expect(cueCalls().length).toBe(before);
  });

  it("a paused Sanctuary mix keeps its lock-screen session", async () => {
    await act(() => audio.play("rain"));
    await act(async () => audio.pauseAll());
    (setAudioModeAsync as jest.Mock).mockClear();
    (createAudioPlayer as jest.Mock).mockClear(); // in Jest every audio asset resolves to the same id
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderWithApp(<BoxBreathing />);
    await user.press(screen.getByRole("button", { name: "Begin" }));
    await act(async () => jest.advanceTimersByTime(300));
    expect(cueCalls().length).toBe(1);
    expect(setAudioModeAsync).not.toHaveBeenCalled();
    await act(async () => audio.reset());
  });
});

