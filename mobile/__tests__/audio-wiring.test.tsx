import { act, render } from "@testing-library/react-native";
import { AMBIENT_TRACKS, MUSIC_TRACKS } from "@mindcocoon/core/sounds";
import { vi } from "@mindcocoon/core/i18n/dictionaries/vi";
import { setAudioModeAsync } from "expo-audio";
import { AudioLabelsSync } from "@/components/sanctuary/AudioLabelsSync";
import { audio, startAudioLifecycle } from "@/lib/audio";
import { TRACK_SOURCES } from "@/lib/audio/sources";
import { fakePlayer } from "@/test-utils/audio";
import { renderWithApp } from "@/test-utils/render";

beforeEach(async () => {
  await act(async () => audio.reset());
});

it("every free ambient and music track has a bundled source", () => {
  for (const track of [...AMBIENT_TRACKS, ...MUSIC_TRACKS]) {
    expect(TRACK_SOURCES[track.id]).toBeDefined();
  }
});

it("the audio session is set for background playback before the first sound", async () => {
  await act(() => audio.play("rain"));
  expect(setAudioModeAsync).toHaveBeenCalledWith({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: "doNotMix" });
  expect(fakePlayer("rain")?.calls).toContain("play");
});

it("returning to the foreground re-checks the sleep timer", async () => {
  let listener: ((s: string) => void) | undefined;
  const appState = {
    addEventListener: (_: "change", fn: (s: string) => void) => {
      listener = fn;
      return { remove: () => (listener = undefined) };
    },
  };
  const stop = startAudioLifecycle(appState);
  const now = jest.spyOn(Date, "now");
  await act(() => audio.play("rain"));
  await act(async () => audio.setSleepTimer(10));
  now.mockReturnValue(Date.now() + 11 * 60_000);
  await act(async () => listener?.("active"));
  expect(audio.getState().playing).toEqual([]);
  now.mockRestore();
  stop();
});

it("labels follow the language", async () => {
  await renderWithApp(<AudioLabelsSync />, { locale: "vi" });
  await act(() => audio.play("rain"));
  expect(fakePlayer("rain")?.lockScreen).toEqual({
    active: true,
    meta: { title: vi.sounds.rain, artist: "MindCocoon", albumTitle: vi.sanctuary.title },
  });
});

it("never renders anything itself", async () => {
  const { toJSON } = await render(<AudioLabelsSync />);
  expect(toJSON()).toBeNull();
});
