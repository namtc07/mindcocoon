import { act, screen, userEvent, waitFor } from "@testing-library/react-native";
import SanctuaryScreen from "@/app/(tabs)/sanctuary";
import { ToastHost } from "@/components/ui/Toast";
import { __resetAdsForTests, startAds } from "@/lib/ads/admob";
import type { RemoteFlags } from "@/lib/ads/policy";
import { audio } from "@/lib/audio";
import { getPref, setPref } from "@/lib/prefs";
import { remoteConfig } from "@/lib/remote-config";
import { renderWithApp } from "@/test-utils/render";

const ON: RemoteFlags = { adsEnabled: true, rewardedEnabled: true, quietHours: [23, 5] };
const rewarded = () => (jest.requireMock("react-native-google-mobile-ads") as { __rewarded: { emit(t: string, p?: unknown): void; load: jest.Mock; show: jest.Mock } }).__rewarded;
const UNLOCK = "Watch an ad to unlock Distant thunder for 24 hours";

async function setup(flags: RemoteFlags = ON, unlocks?: Record<string, number>) {
  jest.clearAllMocks();
  __resetAdsForTests();
  await act(async () => {
    audio.reset();
    await setPref("unlocks", unlocks);
    await setPref("flags", { value: flags, fetchedAt: Date.now() });
    remoteConfig.reload();
    await startAds();
  });
  const user = userEvent.setup();
  await renderWithApp(
    <>
      <SanctuaryScreen />
      <ToastHost />
    </>,
  );
  return user;
}

describe("Premium sounds", () => {
  it("earning the reward unlocks the sound", async () => {
    const user = await setup();
    await user.press(await screen.findByRole("button", { name: UNLOCK }));
    expect(rewarded().load).toHaveBeenCalled();
    await act(async () => rewarded().emit("rewarded_loaded"));
    expect(rewarded().show).toHaveBeenCalled();
    await act(async () => {
      rewarded().emit("rewarded_earned_reward", { type: "unlock", amount: 1 });
      rewarded().emit("closed");
    });
    expect(await screen.findByRole("button", { name: "Play: Distant thunder" })).toBeOnTheScreen();
    expect(screen.getByText(/^Unlocked until /)).toBeOnTheScreen();
    expect(getPref("unlocks")?.thunder).toBeGreaterThan(Date.now());
    await user.press(screen.getByRole("button", { name: "Play: Distant thunder" }));
    expect(audio.getState().playing).toEqual(["thunder"]);
  });

  it("closing early keeps it locked", async () => {
    const user = await setup();
    await user.press(await screen.findByRole("button", { name: UNLOCK }));
    await act(async () => {
      rewarded().emit("rewarded_loaded");
      rewarded().emit("closed");
    });
    expect(await screen.findByRole("button", { name: UNLOCK })).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Play: Distant thunder" })).not.toBeOnTheScreen();
    expect(getPref("unlocks")).toBeUndefined();
  });

  it('a failed ad shows "No ad right now…"', async () => {
    const user = await setup();
    await user.press(await screen.findByRole("button", { name: UNLOCK }));
    await act(async () => rewarded().emit("error", new Error("no fill")));
    expect(await screen.findByText("No ad right now. Try again later.")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: UNLOCK })).toBeOnTheScreen();
  });

  it("an ad that never loads gives up after 10 seconds", async () => {
    jest.useFakeTimers({ advanceTimers: true });
    try {
      const user = await setup();
      await user.press(await screen.findByRole("button", { name: UNLOCK }));
      await act(async () => jest.advanceTimersByTime(10_100));
      expect(await screen.findByText("No ad right now. Try again later.")).toBeOnTheScreen();
    } finally {
      jest.useRealTimers();
    }
  });

  it("no unlock button when rewarded is off", async () => {
    await setup({ ...ON, rewardedEnabled: false });
    await screen.findByText("Sounds");
    expect(screen.queryByRole("button", { name: UNLOCK })).not.toBeOnTheScreen();
    expect(screen.queryByText("More sounds")).not.toBeOnTheScreen();
  });

  it("allowed in quiet hours", async () => {
    jest.useFakeTimers({ advanceTimers: true, now: new Date(2026, 9, 17, 23, 45) });
    try {
      await setup();
      expect(await screen.findByRole("button", { name: UNLOCK })).toBeOnTheScreen();
    } finally {
      jest.useRealTimers();
    }
  });

  it("the play button for a locked sound is not offered", async () => {
    await setup();
    await screen.findByRole("button", { name: UNLOCK });
    expect(screen.queryByRole("button", { name: "Play: Distant thunder" })).not.toBeOnTheScreen();
  });

  it("an unlocked sound stays playable even with rewarded switched off", async () => {
    await setup({ ...ON, rewardedEnabled: false }, { thunder: Date.now() + 60_000 });
    expect(await screen.findByRole("button", { name: "Play: Distant thunder" })).toBeOnTheScreen();
    expect(screen.getByText("More sounds")).toBeOnTheScreen();
  });
});
