import { act, screen, within } from "@testing-library/react-native";
import { NativeAd } from "react-native-google-mobile-ads";
import TodayScreen from "@/app/(tabs)/index";
import { __resetAdsForTests, startAds } from "@/lib/ads/admob";
import type { RemoteFlags } from "@/lib/ads/policy";
import { setPref } from "@/lib/prefs";
import { remoteConfig } from "@/lib/remote-config";
import { renderWithApp } from "@/test-utils/render";

const nativeMock = () => (jest.requireMock("react-native-google-mobile-ads") as { __nativeAd: { destroy: jest.Mock } }).__nativeAd;
const ON: RemoteFlags = { adsEnabled: true, rewardedEnabled: false, quietHours: null };

async function withFlags(flags: RemoteFlags) {
  jest.clearAllMocks();
  __resetAdsForTests();
  await act(async () => {
    await setPref("flags", { value: flags, fetchedAt: Date.now() });
    remoteConfig.reload();
    await startAds();
  });
}

describe("Native ad card on Today", () => {
  it("looks like a card, is clearly labelled as an ad, and shows the ad's own words", async () => {
    await withFlags(ON);
    await renderWithApp(<TodayScreen />, { keepState: true });
    const card = await screen.findByTestId("native-ad");
    expect(within(card).getByText("Ad")).toBeOnTheScreen();
    expect(within(card).getByText("Quiet Tea Co.")).toBeOnTheScreen();
    expect(within(card).getByText("Loose-leaf tea for slow evenings.")).toBeOnTheScreen();
    expect(within(card).getByText("Learn more")).toBeOnTheScreen();
    expect(NativeAd.createForAdRequest).toHaveBeenCalledWith("test-native", { requestNonPersonalizedAdsOnly: true });
  });

  it("comes after the check-in", async () => {
    await withFlags(ON);
    await renderWithApp(<TodayScreen />, { keepState: true });
    await screen.findByTestId("native-ad");
    const ids = screen.getAllByTestId(/^(today-checkin|native-ad|today-prompt)$/).map((n) => n.props.testID);
    expect(ids.indexOf("native-ad")).toBeGreaterThan(ids.indexOf("today-checkin"));
  });

  it("nothing when ads are off", async () => {
    await withFlags({ ...ON, adsEnabled: false });
    await renderWithApp(<TodayScreen />, { keepState: true });
    await screen.findByText(/Good/);
    expect(NativeAd.createForAdRequest).not.toHaveBeenCalled();
    expect(screen.queryByTestId("native-ad")).not.toBeOnTheScreen();
  });

  it("nothing if no ad loads", async () => {
    await withFlags(ON);
    (NativeAd.createForAdRequest as jest.Mock).mockRejectedValueOnce(new Error("no fill"));
    await renderWithApp(<TodayScreen />, { keepState: true });
    await act(async () => {});
    expect(screen.queryByTestId("native-ad")).not.toBeOnTheScreen();
  });

  it("the ad is released when Today goes away", async () => {
    await withFlags(ON);
    const view = await renderWithApp(<TodayScreen />, { keepState: true });
    await screen.findByTestId("native-ad");
    await view.unmount();
    expect(nativeMock().destroy).toHaveBeenCalled();
  });
});
