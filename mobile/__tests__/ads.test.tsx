import { initVault } from "@mindcocoon/core/vault/session";
import { act, fireEvent, screen } from "@testing-library/react-native";
import type { ReactElement } from "react";
import TodayScreen from "@/app/(tabs)/index";
import MoodScreen from "@/app/(tabs)/mood";
import SanctuaryScreen from "@/app/(tabs)/sanctuary";
import VaultScreen from "@/app/(tabs)/vault";
import VentScreen from "@/app/(tabs)/vent";
import HelpScreen from "@/app/help";
import SettingsScreen from "@/app/settings";
import { AfterRelease } from "@/components/vent/AfterRelease";
import { __resetAdsForTests, startAds } from "@/lib/ads/admob";
import type { RemoteFlags } from "@/lib/ads/policy";
import { setPref } from "@/lib/prefs";
import { remoteConfig } from "@/lib/remote-config";
import { renderWithApp } from "@/test-utils/render";

const ON: RemoteFlags = { adsEnabled: true, rewardedEnabled: true, quietHours: [23, 5] };

async function adsAt(hour: number, flags: RemoteFlags = ON) {
  jest.useFakeTimers({ advanceTimers: true, now: new Date(2026, 9, 17, hour, 30) });
  __resetAdsForTests();
  await act(async () => {
    await setPref("flags", { value: flags, fetchedAt: Date.now() });
    remoteConfig.reload();
    await startAds();
  });
}

async function show(ui: ReactElement) {
  await renderWithApp(ui);
  await act(async () => {
    await initVault();
  });
}

afterEach(() => {
  jest.useRealTimers();
});

describe("Banner", () => {
  it("Today shows the banner at the end when ads are on", async () => {
    await adsAt(12);
    await show(<TodayScreen />);
    expect(await screen.findByTestId("ad-banner")).toBeOnTheScreen();
    expect(screen.getByTestId("admob-banner").props).toMatchObject({
      unitId: "test-adaptive-banner",
      size: "ANCHORED_ADAPTIVE_BANNER",
      requestOptions: { requestNonPersonalizedAdsOnly: true },
    });
  });

  it("Mood shows it too", async () => {
    await adsAt(12);
    await show(<MoodScreen />);
    expect(await screen.findByTestId("ad-banner")).toBeOnTheScreen();
  });

  it("hidden in quiet hours", async () => {
    await adsAt(23);
    await show(<TodayScreen />);
    expect(screen.queryByTestId("ad-banner")).not.toBeOnTheScreen();
  });

  it("hidden when ads are off", async () => {
    await adsAt(12, { ...ON, adsEnabled: false });
    await show(<TodayScreen />);
    expect(screen.queryByTestId("ad-banner")).not.toBeOnTheScreen();
  });

  it("collapses when the ad fails to load", async () => {
    await adsAt(12);
    await show(<TodayScreen />);
    await act(async () => fireEvent(await screen.findByTestId("admob-banner"), "adFailedToLoad", new Error("no fill")));
    expect(screen.queryByTestId("ad-banner")).not.toBeOnTheScreen();
  });

  it.each([
    ["Vent", <VentScreen key="v" />],
    ["Vault", <VaultScreen key="va" />],
    ["Sanctuary", <SanctuaryScreen key="s" />],
    ["Help", <HelpScreen key="h" />],
    ["Settings", <SettingsScreen key="se" />],
    ["after release", <AfterRelease key="a" onWriteAgain={() => {}} />],
  ])("never on %s", async (_name, ui) => {
    await adsAt(12);
    await show(ui);
    expect(screen.queryByTestId("ad-banner")).not.toBeOnTheScreen();
    expect(screen.queryByTestId("admob-banner")).not.toBeOnTheScreen();
  });
});
