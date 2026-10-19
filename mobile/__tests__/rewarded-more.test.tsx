import { act, screen, userEvent, within } from "@testing-library/react-native";
import TodayScreen from "@/app/(tabs)/index";
import SanctuaryScreen from "@/app/(tabs)/sanctuary";
import { MixChips } from "@/components/sanctuary/MixChips";
import { ToastHost } from "@/components/ui/Toast";
import { __resetAdsForTests, startAds } from "@/lib/ads/admob";
import type { RemoteFlags } from "@/lib/ads/policy";
import { audio } from "@/lib/audio";
import { getPref, setPref } from "@/lib/prefs";
import { remoteConfig } from "@/lib/remote-config";
import { renderWithApp } from "@/test-utils/render";

const ON: RemoteFlags = { adsEnabled: true, rewardedEnabled: true, quietHours: null, premiumSoundsLocked: true };
const rewarded = () => (jest.requireMock("react-native-google-mobile-ads") as { __rewarded: { emit(t: string, p?: unknown): void } }).__rewarded;

async function adsOn(flags: RemoteFlags = ON) {
  jest.clearAllMocks();
  __resetAdsForTests();
  await act(async () => {
    audio.reset();
    await setPref("unlocks", undefined);
    await setPref("mixes", undefined);
    await setPref("extraMixSlots", undefined);
    await setPref("sanctuaryTab", undefined);
    await setPref("flags", { value: flags, fetchedAt: Date.now() });
    remoteConfig.reload();
    await startAds();
  });
}

async function earn() {
  await act(async () => rewarded().emit("rewarded_loaded"));
  await act(async () => {
    rewarded().emit("rewarded_earned_reward", { type: "unlock", amount: 1 });
    rewarded().emit("closed");
  });
}

const mixes = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `m${i + 1}`, n: i + 1, mix: { volumes: { rain: 0.5 } }, createdAt: "2026-10-19T00:00:00Z" }));

describe("More things a short ad can open (always the person's choice)", () => {
  it("one ad opens every extra sound for 24 hours", async () => {
    await adsOn();
    const user = userEvent.setup();
    await renderWithApp(
      <>
        <SanctuaryScreen />
        <ToastHost />
      </>,
    );
    await user.press(await screen.findByRole("button", { name: "Watch one ad to open all extra sounds for 24 hours" }));
    await earn();
    const unlocks = getPref("unlocks") ?? {};
    for (const id of ["thunder", "stream", "singing-bowl", "deep-hum"]) expect(unlocks[id]).toBeGreaterThan(Date.now());
    expect(await screen.findByRole("button", { name: "Play: Deep hum" })).toBeOnTheScreen();
  });

  it("when five mixes are saved, an ad adds room for one more (up to ten)", async () => {
    await adsOn();
    await act(async () => {
      await setPref("mixes", mixes(5));
      await audio.play("ocean");
    });
    const user = userEvent.setup();
    await renderWithApp(<MixChips />, { keepState: true });
    await user.press(await screen.findByRole("button", { name: "Watch an ad to save one more mix" }));
    await earn();
    expect(getPref("extraMixSlots")).toBe(1);
    expect(screen.getByRole("button", { name: "Save this mix" })).toBeEnabled();
  });

  it("no extra slots past ten mixes", async () => {
    await adsOn();
    await act(async () => {
      await setPref("mixes", mixes(10));
      await setPref("extraMixSlots", 5);
      await audio.play("ocean");
    });
    await renderWithApp(<MixChips />, { keepState: true });
    expect(screen.queryByRole("button", { name: "Watch an ad to save one more mix" })).not.toBeOnTheScreen();
  });

  it("nothing is offered when rewarded ads are off", async () => {
    await adsOn({ ...ON, rewardedEnabled: false });
    await act(async () => {
      await setPref("mixes", mixes(5));
      await audio.play("ocean");
    });
    await renderWithApp(<MixChips />, { keepState: true });
    expect(screen.queryByRole("button", { name: "Watch an ad to save one more mix" })).not.toBeOnTheScreen();
  });
});

describe("The banner stays in view", () => {
  it("on Today it sits above the tab bar, outside the scrolling page", async () => {
    await adsOn();
    await renderWithApp(<TodayScreen />);
    const banner = await screen.findByTestId("ad-banner");
    expect(within(screen.getByTestId("screen-scroll")).queryByTestId("ad-banner")).toBeNull();
    expect(banner).toBeOnTheScreen();
  });
});
