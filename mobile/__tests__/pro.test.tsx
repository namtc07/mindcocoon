import { act, screen, userEvent } from "@testing-library/react-native";
import TodayScreen from "@/app/(tabs)/index";
import ProScreen from "@/app/pro";
import SettingsScreen from "@/app/settings";
import { MixChips } from "@/components/sanctuary/MixChips";
import { __resetAdsForTests, startAds } from "@/lib/ads/admob";
import { audio } from "@/lib/audio";
import { getPref, setPref } from "@/lib/prefs";
import { remoteConfig } from "@/lib/remote-config";
import { router } from "expo-router";
import { renderWithApp } from "@/test-utils/render";

beforeEach(async () => {
  jest.clearAllMocks();
  await renderWithApp(<></>);
  await act(async () => {
    audio.reset();
    await setPref("pro", undefined);
    await setPref("testPurchases", undefined);
    await setPref("mixes", undefined);
    await setPref("proMoments", undefined);
    await setPref("firstRunSeen", undefined);
  });
});

describe("MindCocoon Pro (test store in development)", () => {
  it("shows what Pro gives, three plans with test prices, and says no money is charged", async () => {
    await renderWithApp(<ProScreen />, { keepState: true });
    expect(screen.getByText("No ads, anywhere")).toBeOnTheScreen();
    for (const plan of [/Monthly/, /Yearly/, /Lifetime/]) expect(await screen.findByRole("radio", { name: plan })).toBeOnTheScreen();
    expect(screen.getByRole("radio", { name: /Yearly/ })).toBeChecked();
    expect(screen.getByText(/Test purchase: no money is charged/)).toBeOnTheScreen();
  });

  it("buying turns Pro on", async () => {
    const user = userEvent.setup();
    await renderWithApp(<ProScreen />, { keepState: true });
    await user.press(await screen.findByRole("radio", { name: /Lifetime/ }));
    await user.press(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Thank you. Pro is on.")).toBeOnTheScreen();
    expect(getPref("pro")?.plan).toBe("lifetime");
  });

  it("restore with nothing bought says so", async () => {
    const user = userEvent.setup();
    await renderWithApp(<ProScreen />, { keepState: true });
    await user.press(await screen.findByRole("button", { name: "Restore purchases" }));
    expect(await screen.findByText("Nothing to restore on this account.")).toBeOnTheScreen();
  });

  it("with Pro there are no ads on Today", async () => {
    __resetAdsForTests();
    await act(async () => {
      await setPref("flags", { value: { adsEnabled: true, rewardedEnabled: true, quietHours: null }, fetchedAt: Date.now() });
      remoteConfig.reload();
      await startAds();
      await setPref("pro", { plan: "yearly", since: Date.now() });
    });
    await renderWithApp(<TodayScreen />, { keepState: true });
    await screen.findByTestId("feeling-orbs");
    expect(screen.queryByTestId("ad-banner")).not.toBeOnTheScreen();
    expect(screen.queryByTestId("native-ad")).not.toBeOnTheScreen();
    await act(async () => {
      await setPref("flags", undefined);
      remoteConfig.reload();
    });
  });

  it("with Pro, up to twenty mixes can be saved", async () => {
    const mixes = Array.from({ length: 10 }, (_, i) => ({ id: `m${i}`, n: i + 1, mix: { volumes: { rain: 0.5 } }, createdAt: "2026-10-19T00:00:00Z" }));
    await act(async () => {
      await setPref("mixes", mixes);
      await setPref("pro", { plan: "monthly", since: Date.now() });
      await audio.play("ocean");
    });
    await renderWithApp(<MixChips />, { keepState: true });
    expect(screen.getByRole("button", { name: "Save this mix" })).toBeEnabled();
  });

  it("Settings leads to Pro once a moment of value has happened, and says when it is on", async () => {
    const user = userEvent.setup();
    await act(async () => {
      await setPref("firstRunSeen", true);
      await setPref("proMoments", ["sleep-fade"]);
    });
    await renderWithApp(<SettingsScreen />, { keepState: true });
    await user.press(screen.getByRole("link", { name: "MindCocoon Pro" }));
    expect(router.push).toHaveBeenCalledWith("/pro");
    await act(() => setPref("pro", { plan: "yearly", since: Date.now() }));
    expect(await screen.findByRole("link", { name: "MindCocoon Pro · On" })).toBeOnTheScreen();
  });

  it("Settings does not offer Pro before any moment of value", async () => {
    await act(async () => {
      await setPref("firstRunSeen", true);
      await setPref("proMoments", undefined);
    });
    await renderWithApp(<SettingsScreen />, { keepState: true });
    await screen.findByText("Settings");
    expect(screen.queryByRole("link", { name: "MindCocoon Pro" })).not.toBeOnTheScreen();
  });
});
