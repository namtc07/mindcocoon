import { act, screen, userEvent } from "@testing-library/react-native";
import TodayScreen from "@/app/(tabs)/index";
import SettingsScreen from "@/app/settings";
import { ToastHost } from "@/components/ui/Toast";
import { __resetAdsForTests, startAds } from "@/lib/ads/admob";
import type { RemoteFlags } from "@/lib/ads/policy";
import { getPref, setPref } from "@/lib/prefs";
import { remoteConfig } from "@/lib/remote-config";
import { renderWithApp } from "@/test-utils/render";

let mockNow = new Date(2026, 9, 19, 12, 0);
jest.mock("@/hooks/use-now", () => ({ useNow: () => mockNow }));

const ON: RemoteFlags = { adsEnabled: true, rewardedEnabled: true, quietHours: null };
const rewarded = () => (jest.requireMock("react-native-google-mobile-ads") as { __rewarded: { emit(t: string, p?: unknown): void } }).__rewarded;

async function adsOn(flags: RemoteFlags = ON) {
  jest.clearAllMocks();
  __resetAdsForTests();
  await renderWithApp(<></>);
  await act(async () => {
    await setPref("nativeHiddenOn", undefined);
    await setPref("adFreeUntil", undefined);
    await setPref("flags", { value: flags, fetchedAt: Date.now() });
    remoteConfig.reload();
    await startAds();
  });
}

async function earn() {
  await act(async () => rewarded().emit("rewarded_loaded"));
  await act(async () => {
    rewarded().emit("rewarded_earned_reward", { type: "ad-free", amount: 1 });
    rewarded().emit("closed");
  });
}

const today = (
  <>
    <TodayScreen />
    <ToastHost />
  </>
);

describe("Hiding the native ad", () => {
  it("× hides it for the rest of the day; it comes back tomorrow", async () => {
    mockNow = new Date(2026, 9, 19, 12, 0);
    await adsOn();
    const user = userEvent.setup();
    await renderWithApp(today, { keepState: true });
    await screen.findByTestId("native-ad");
    await user.press(screen.getByRole("button", { name: "Hide this ad for today" }));
    expect(screen.queryByTestId("native-ad")).not.toBeOnTheScreen();
    mockNow = new Date(2026, 9, 20, 9, 0);
    await renderWithApp(today, { keepState: true });
    expect(await screen.findByTestId("native-ad")).toBeOnTheScreen();
    mockNow = new Date(2026, 9, 19, 12, 0);
  });

  it("after hiding, a short ad can turn ads off for 24 hours (only if the person taps it)", async () => {
    await adsOn();
    const user = userEvent.setup();
    await renderWithApp(today, { keepState: true });
    await screen.findByTestId("native-ad");
    await user.press(screen.getByRole("button", { name: "Hide this ad for today" }));
    await user.press(await screen.findByRole("button", { name: "No ads for 24 hours" }));
    await earn();
    expect(getPref("adFreeUntil")).toBeGreaterThan(Date.now() + 23 * 3600_000);
    expect(screen.queryByTestId("ad-banner")).not.toBeOnTheScreen();
  });
});

describe("Ads off for 24 hours", () => {
  it("Settings offers it, then says until when", async () => {
    await adsOn();
    const user = userEvent.setup();
    await renderWithApp(<SettingsScreen />, { keepState: true });
    await user.press(await screen.findByRole("button", { name: "Watch one ad to turn ads off for 24 hours" }));
    await earn();
    expect(await screen.findByText(/^Ads are off until /)).toBeOnTheScreen();
  });

  it("while it lasts, Today shows no banner and no native ad", async () => {
    await adsOn();
    await act(() => setPref("adFreeUntil", Date.now() + 3600_000));
    await renderWithApp(today, { keepState: true });
    await screen.findByText(/Good/);
    expect(screen.queryByTestId("ad-banner")).not.toBeOnTheScreen();
    expect(screen.queryByTestId("native-ad")).not.toBeOnTheScreen();
  });
});

describe("Remote switches for the ad-free option", () => {
  it("ad_free_enabled = false hides the offer everywhere", async () => {
    await adsOn({ ...ON, adFreeEnabled: false });
    const user = userEvent.setup();
    await renderWithApp(<SettingsScreen />, { keepState: true });
    await screen.findByText("Settings");
    expect(screen.queryByRole("button", { name: "Watch one ad to turn ads off for 24 hours" })).not.toBeOnTheScreen();
    await renderWithApp(today, { keepState: true });
    await user.press(await screen.findByRole("button", { name: "Hide this ad for today" }));
    expect(await screen.findByText("Hidden until tomorrow.")).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: /No ads for/ })).not.toBeOnTheScreen();
  });

  it("ad_free_hours sets how long it lasts, and the wording follows", async () => {
    await adsOn({ ...ON, adFreeHours: 12 });
    const user = userEvent.setup();
    await renderWithApp(<SettingsScreen />, { keepState: true });
    await user.press(await screen.findByRole("button", { name: "Watch one ad to turn ads off for 12 hours" }));
    await earn();
    const until = getPref("adFreeUntil") ?? 0;
    expect(until).toBeGreaterThan(Date.now() + 11.9 * 3600_000);
    expect(until).toBeLessThan(Date.now() + 12.1 * 3600_000);
  });
});
