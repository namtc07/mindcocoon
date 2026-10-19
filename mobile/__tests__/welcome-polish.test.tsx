import { act, fireEvent, screen, userEvent, waitFor } from "@testing-library/react-native";
import * as Notifications from "expo-notifications";
import mobileAds from "react-native-google-mobile-ads";
import TodayScreen from "@/app/(tabs)/index";
import { AdsBootstrap } from "@/components/ads/AdsBootstrap";
import { CheckinForm } from "@/components/mood/CheckinForm";
import { Welcome } from "@/components/onboarding/Welcome";
import { NameSetting } from "@/components/settings/NameSetting";
import { __resetAdsForTests } from "@/lib/ads/admob";
import { clearPrefs, getPref, setPref } from "@/lib/prefs";
import { remoteConfig } from "@/lib/remote-config";
import { finishModalDismissals } from "@/test-utils/modals";
import { renderWithApp } from "@/test-utils/render";

const mockNow = new Date(2026, 9, 19, 21, 0);
jest.mock("@/hooks/use-now", () => ({ useNow: () => mockNow }));

beforeEach(async () => {
  await act(() => clearPrefs());
});

async function toStep3(user: ReturnType<typeof userEvent.setup>) {
  await renderWithApp(<Welcome />);
  await user.press(await screen.findByRole("button", { name: "Continue" }));
  await user.press(screen.getByRole("button", { name: "Continue" }));
}

it("a name with $ signs is greeted as typed", async () => {
  await act(() => setPref("name", "$& Mai"));
  await renderWithApp(<TodayScreen />);
  expect(screen.getByRole("header", { name: "Good evening, $& Mai" })).toBeOnTheScreen();
});

it("says so when the reminder permission is refused, and turns the switch back off", async () => {
  const user = userEvent.setup();
  (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ granted: false, canAskAgain: false, status: "denied" });
  await toStep3(user);
  await act(async () => fireEvent(screen.getByRole("switch", { name: "Remind me in the evening" }), "valueChange", true));
  await user.press(screen.getByRole("button", { name: "Begin" }));
  expect(await screen.findByText(/notifications are off/i)).toBeOnTheScreen();
  expect(screen.getByRole("switch", { name: "Remind me in the evening" })).toHaveProp("value", false);
  expect(getPref("firstRunSeen")).toBeUndefined();
  await user.press(screen.getByRole("button", { name: "Begin" }));
  expect(getPref("firstRunSeen")).toBe(true);
});

it("Android back goes one step back instead of skipping everything", async () => {
  const user = userEvent.setup();
  await toStep3(user);
  await user.type(screen.getByLabelText("What should we call you?"), "Mai");
  await act(async () => fireEvent(screen.getByTestId("welcome"), "requestClose"));
  expect(screen.getByText("What brings you here?")).toBeOnTheScreen();
  expect(getPref("firstRunSeen")).toBeUndefined();
  await act(async () => fireEvent(screen.getByTestId("welcome"), "requestClose"));
  await act(async () => fireEvent(screen.getByTestId("welcome"), "requestClose"));
  expect(getPref("firstRunSeen")).toBe(true);
});

it("ads wait until the welcome has finished closing", async () => {
  const user = userEvent.setup();
  __resetAdsForTests();
  await act(async () => {
    await setPref("flags", { value: { adsEnabled: true, rewardedEnabled: false, quietHours: [23, 5] }, fetchedAt: Date.now() });
    remoteConfig.reload();
  });
  (mobileAds().initialize as jest.Mock).mockClear();
  await renderWithApp(
    <>
      <Welcome />
      <AdsBootstrap />
    </>,
    { keepState: true },
  );
  await user.press(await screen.findByRole("button", { name: "Skip" }));
  expect(mobileAds().initialize).not.toHaveBeenCalled();
  await finishModalDismissals();
  await waitFor(() => expect(mobileAds().initialize).toHaveBeenCalledTimes(1));
  await act(async () => {
    await setPref("flags", undefined);
    remoteConfig.reload();
  });
});

it("a name being edited in Settings is kept when leaving the screen", async () => {
  const user = userEvent.setup();
  const view = await renderWithApp(<NameSetting />);
  await user.type(screen.getByLabelText("Your name"), "Mai");
  await view.unmount();
  expect(getPref("name")).toBe("Mai");
});

it("the full check-in form uses the mood meter too", async () => {
  await renderWithApp(<CheckinForm />);
  expect(screen.getByTestId("feeling-orbs")).toBeOnTheScreen();
});
