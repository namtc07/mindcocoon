import { act, screen, within } from "@testing-library/react-native";
import { addMood } from "@mindcocoon/core/mood/store";
import { NativeAd } from "react-native-google-mobile-ads";
import { MoodHistory } from "@/components/mood/MoodHistory";
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
  await renderWithApp(<></>);
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

  it("sits at the very end of Today, never right after the check-in", async () => {
    await withFlags(ON);
    await renderWithApp(<TodayScreen />, { keepState: true });
    const card = await screen.findByTestId("native-ad");
    expect(within(screen.getByTestId("today-checkin")).queryByTestId("native-ad")).toBeNull();
    const ids = screen.getAllByTestId(/^(today-.*|native-ad)$/).map((n) => n.props.testID);
    expect(ids[ids.length - 1]).toBe("native-ad");
    expect(card).toBeOnTheScreen();
  });

  it.each(["heavy", "alone", "anxious", "angry"] as const)("is left out on a %s day", async (mood) => {
    await withFlags(ON);
    await act(async () => {
      await addMood({ mood, tags: [] });
    });
    await renderWithApp(<TodayScreen />, { keepState: true });
    await screen.findByText(/Today: /);
    expect(NativeAd.createForAdRequest).not.toHaveBeenCalled();
    expect(screen.queryByTestId("native-ad")).not.toBeOnTheScreen();
  });

  it("is still there on a lighter day", async () => {
    await withFlags(ON);
    await act(async () => {
      await addMood({ mood: "peaceful", tags: [] });
    });
    await renderWithApp(<TodayScreen />, { keepState: true });
    expect(await screen.findByTestId("native-ad")).toBeOnTheScreen();
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

describe("Native ad in the Mood history", () => {
  const logs = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ id: `l${i}`, mood: "peaceful" as const, tags: [], createdAt: new Date(2026, 9, 19 - i, 21).toISOString() }));

  it("sits among past check-ins, after the third", async () => {
    await withFlags(ON);
    await renderWithApp(<MoodHistory logs={logs(5)} />, { keepState: true });
    const card = await screen.findByTestId("native-ad");
    const rows = screen.getAllByTestId(/^(history-row|native-ad)$/).map((n) => n.props.testID);
    expect(rows.indexOf("native-ad")).toBe(3);
    expect(card).toBeOnTheScreen();
    expect(NativeAd.createForAdRequest).toHaveBeenCalledWith("test-native", { requestNonPersonalizedAdsOnly: true });
  });

  it("not with fewer than three check-ins", async () => {
    await withFlags(ON);
    await renderWithApp(<MoodHistory logs={logs(2)} />, { keepState: true });
    await screen.findAllByText("Peaceful");
    expect(screen.queryByTestId("native-ad")).not.toBeOnTheScreen();
  });
});
