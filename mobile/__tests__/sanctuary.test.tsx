import { pickTonightTrack } from "@mindcocoon/core/audio/tonight";
import { addMood } from "@mindcocoon/core/mood/store";
import { SOUND_TRACKS } from "@mindcocoon/core/sounds";
import { act, fireEvent, screen, userEvent, waitFor } from "@testing-library/react-native";
import { setAudioModeAsync } from "expo-audio";
import SanctuaryScreen from "@/app/(tabs)/sanctuary";
import { ToastHost } from "@/components/ui/Toast";
import { audio } from "@/lib/audio";
import { fakePlayer } from "@/test-utils/audio";
import { renderWithApp } from "@/test-utils/render";

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
