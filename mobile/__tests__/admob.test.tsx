import { act, render } from "@testing-library/react-native";
import mobileAds, { AdsConsent } from "react-native-google-mobile-ads";
import { AdsBootstrap } from "@/components/ads/AdsBootstrap";
import { __resetAdsForTests, AD_REQUEST, adUnitId, getAdsReady, startAds } from "@/lib/ads/admob";
import { setPref } from "@/lib/prefs";
import { remoteConfig } from "@/lib/remote-config";

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

it("still initialises when consent fails", async () => {
  (AdsConsent.gatherConsent as jest.Mock).mockRejectedValueOnce(new Error("offline"));
  await startAds();
  expect(sdk.initialize).toHaveBeenCalled();
  expect(getAdsReady()).toBe(true);
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
