import { act, fireEvent, screen, userEvent, waitFor } from "@testing-library/react-native";
import SanctuaryScreen from "@/app/(tabs)/sanctuary";
import SettingsScreen from "@/app/settings";
import WindDownScreen from "@/app/wind-down";
import { ToastHost } from "@/components/ui/Toast";
import { audio } from "@/lib/audio";
import { getPref, setPref } from "@/lib/prefs";
import { playReleaseSound, SFX_SOURCES } from "@/lib/release-sound";
import { renderWithApp } from "@/test-utils/render";

const withToasts = (ui: React.ReactElement) => (
  <>
    {ui}
    <ToastHost />
  </>
);

beforeEach(async () => {
  jest.clearAllMocks();
  await act(async () => {
    audio.reset();
    await setPref("mixes", undefined);
    await setPref("unlocks", undefined);
    await setPref("audio", undefined);
  });
});

describe("Sounds never fail silently", () => {
  it("removing a saved mix can be undone", async () => {
    const user = userEvent.setup();
    await act(() => setPref("mixes", [{ id: "a", n: 1, mix: { volumes: { rain: 0.5 } }, createdAt: "2026-10-19T00:00:00.000Z" }]));
    await renderWithApp(withToasts(<SanctuaryScreen />));
    await user.press(await screen.findByRole("button", { name: "Remove My mix 1" }));
    expect(await screen.findByText("Removed My mix 1")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Undo" }));
    expect(await screen.findByRole("button", { name: "My mix 1" })).toBeOnTheScreen();
    expect(getPref("mixes")).toHaveLength(1);
  });

  it("a mix that can't play says so and keeps what's playing", async () => {
    const user = userEvent.setup();
    await act(async () => {
      await setPref("mixes", [{ id: "a", n: 1, mix: { volumes: { thunder: 0.5 } }, createdAt: "2026-10-19T00:00:00.000Z" }]);
      await audio.play("ocean");
    });
    await renderWithApp(withToasts(<SanctuaryScreen />));
    await user.press(await screen.findByRole("button", { name: "My mix 1" }));
    expect(await screen.findByText("That mix couldn't play.")).toBeOnTheScreen();
    expect(audio.getState().playing).toEqual(["ocean"]);
  });

  it("sliders save once when released, not on every step", async () => {
    await renderWithApp(<SanctuaryScreen />);
    const slider = await screen.findByLabelText("Volume for Rain");
    await act(async () => {
      fireEvent(slider, "valueChange", 0.3);
      fireEvent(slider, "valueChange", 0.31);
    });
    expect(getPref("audio")).toBeUndefined();
    expect(audio.getState().volumes.rain).toBe(0.31);
    await act(async () => fireEvent(slider, "slidingComplete", 0.32));
    expect(getPref("audio")?.volumes.rain).toBe(0.32);
  });

  it("Goodnight can keep what's already playing", async () => {
    await act(() => audio.play("campfire"));
    const user = userEvent.setup();
    await renderWithApp(<WindDownScreen />);
    await user.press(await screen.findByRole("button", { name: "Skip" }));
    await user.press(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: "Keep what's playing" })).toBeSelected();
    await user.press(screen.getByRole("button", { name: "Goodnight" }));
    await waitFor(() => expect(audio.getState().sleepMinutes).toBe(30));
    expect(audio.getState().playing).toEqual(["campfire"]);
  });

  it("turning release sounds off stops one that's playing", async () => {
    await act(() => playReleaseSound("burn"));
    const players = (jest.requireMock("expo-audio") as { __players: Map<unknown, { calls: string[] }> }).__players;
    await renderWithApp(<SettingsScreen />);
    const toggle = await screen.findByLabelText("Sound when letting go");
    await act(async () => fireEvent(toggle, "valueChange", false));
    expect(players.get(SFX_SOURCES.burn)?.calls).toContain("remove");
    await act(() => setPref("releaseSound", undefined));
  });
});
