import { act, render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { usePathname } from "expo-router";
import mobileAds, { AdsConsent } from "react-native-google-mobile-ads";
import { AdsBootstrap } from "@/components/ads/AdsBootstrap";
import { __resetAdsForTests, AD_REQUEST, adUnitId, getAdsReady, startAds } from "@/lib/ads/admob";
import { setPref } from "@/lib/prefs";
import { remoteConfig, startRemoteConfig } from "@/lib/remote-config";
import SettingsScreen from "@/app/settings";
import { renderWithApp } from "@/test-utils/render";

const sdk = mobileAds();
const ON = { adsEnabled: true, rewardedEnabled: false, quietHours: [23, 5] as [number, number] };

beforeEach(async () => {
  jest.clearAllMocks();
  __resetAdsForTests();
  await act(async () => {
    await setPref("flags", undefined);
    await setPref("firstRunSeen", undefined);
    remoteConfig.reload();
  });
});

it("waits for the first-run notice and the remote flag", async () => {
  await render(<AdsBootstrap />);
  expect(sdk.initialize).not.toHaveBeenCalled();
  await act(async () => {
    await setPref("flags", { value: ON, fetchedAt: Date.now() });
    remoteConfig.reload();
  });
  expect(sdk.initialize).not.toHaveBeenCalled();
  await act(() => setPref("firstRunSeen", true));
  expect(sdk.initialize).toHaveBeenCalledTimes(1);
  expect(getAdsReady()).toBe(true);
});

it("gathers consent before initialising", async () => {
  const order: string[] = [];
  (AdsConsent.gatherConsent as jest.Mock).mockImplementationOnce(async () => {
    order.push("consent");
    return { canRequestAds: true };
  });
  (sdk.initialize as jest.Mock).mockImplementationOnce(async () => {
    order.push("init");
    return [];
  });
  await startAds();
  expect(order).toEqual(["consent", "init"]);
});

it("no ads when consent says ads can't be requested", async () => {
  (AdsConsent.gatherConsent as jest.Mock).mockResolvedValueOnce({ canRequestAds: false, privacyOptionsRequirementStatus: "REQUIRED" });
  await startAds();
  expect(sdk.initialize).not.toHaveBeenCalled();
  expect(getAdsReady()).toBe(false);
});

it("a consent failure falls back to the last known consent", async () => {
  (AdsConsent.gatherConsent as jest.Mock).mockRejectedValueOnce(new Error("offline"));
  (AdsConsent.getConsentInfo as jest.Mock).mockResolvedValueOnce({ canRequestAds: true, privacyOptionsRequirementStatus: "NOT_REQUIRED" });
  await startAds();
  expect(sdk.initialize).toHaveBeenCalled();
  expect(getAdsReady()).toBe(true);
});

it("never starts (or asks for consent) on Vent, Vault, Sanctuary or Help", async () => {
  await act(async () => {
    await setPref("flags", { value: ON, fetchedAt: Date.now() });
    await setPref("firstRunSeen", true);
    remoteConfig.reload();
  });
  for (const path of ["/vent", "/vault", "/sanctuary", "/help", "/settings"]) {
    (usePathname as jest.Mock).mockReturnValue(path);
    const { unmount } = await render(<AdsBootstrap />);
    await unmount();
  }
  expect(AdsConsent.gatherConsent).not.toHaveBeenCalled();
  (usePathname as jest.Mock).mockReturnValue("/mood");
  await render(<AdsBootstrap />);
  await waitFor(() => expect(AdsConsent.gatherConsent).toHaveBeenCalled());
  await act(() => startAds()); // let that start-up finish inside this test
  (usePathname as jest.Mock).mockReturnValue("/");
});

it("Settings offers ad privacy choices when the law requires them", async () => {
  (AdsConsent.gatherConsent as jest.Mock).mockResolvedValueOnce({ canRequestAds: true, privacyOptionsRequirementStatus: "REQUIRED" });
  await startAds();
  const user = userEvent.setup();
  await renderWithApp(<SettingsScreen />);
  await user.press(await screen.findByRole("button", { name: "Ad privacy choices" }));
  expect(AdsConsent.showPrivacyOptionsForm).toHaveBeenCalled();
});

it("no privacy choices row where none are required", async () => {
  await startAds();
  await renderWithApp(<SettingsScreen />);
  await screen.findByText("Evening reminder");
  expect(screen.queryByRole("button", { name: "Ad privacy choices" })).not.toBeOnTheScreen();
});

it("each cold start fetches fresh switches, even within 6 hours", async () => {
  const refresh = jest.spyOn(remoteConfig, "refresh");
  const stop = startRemoteConfig({ addEventListener: () => ({ remove() {} }) });
  await act(async () => {});
  expect(refresh).toHaveBeenCalledWith(true);
  stop();
  refresh.mockRestore();
});

it("sets a Teen rating and no child-directed tag", async () => {
  await startAds();
  expect(sdk.setRequestConfiguration).toHaveBeenCalledWith({
    maxAdContentRating: "T",
    tagForChildDirectedTreatment: false,
    tagForUnderAgeOfConsent: false,
  });
  expect(AD_REQUEST).toEqual({ requestNonPersonalizedAdsOnly: true });
});

it("uses test ids in development", () => {
  expect(adUnitId("banner-today")).toBe("test-adaptive-banner");
  expect(adUnitId("banner-mood")).toBe("test-adaptive-banner");
  expect(adUnitId("rewarded")).toBe("test-rewarded");
});

it("starts only once", async () => {
  await Promise.all([startAds(), startAds()]);
  await startAds();
  expect(sdk.initialize).toHaveBeenCalledTimes(1);
});
