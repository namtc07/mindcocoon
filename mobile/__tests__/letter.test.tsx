import { addMood } from "@mindcocoon/core/mood/store";
import { act, fireEvent, screen, userEvent } from "@testing-library/react-native";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import TodayScreen from "@/app/(tabs)/index";
import LetterScreen from "@/app/letter";
import SettingsScreen from "@/app/settings";
import { syncLetterNotification } from "@/lib/letter-notification";
import { getPref, setPref } from "@/lib/prefs";
import { renderWithApp } from "@/test-utils/render";
import { en } from "@mindcocoon/core/i18n/dictionaries/en";

// Sunday 18 October 2026, 19:30.
let mockNow = new Date(2026, 9, 18, 19, 30);
jest.mock("@/hooks/use-now", () => ({ useNow: () => mockNow }));

beforeEach(async () => {
  jest.clearAllMocks();
  mockNow = new Date(2026, 9, 18, 19, 30);
  await renderWithApp(<></>);
  await act(async () => {
    await setPref("letterReadOn", undefined);
    await setPref("weeklyLetter", undefined);
    await setPref("name", undefined);
  });
});

describe("Kén's weekly letter", () => {
  it("on Sunday evening, Today offers the letter", async () => {
    const user = userEvent.setup();
    await renderWithApp(<TodayScreen />, { keepState: true });
    expect(screen.getByText("Kén left you a few lines")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Read" }));
    expect(router.push).toHaveBeenCalledWith("/letter");
  });

  it("not on a Wednesday", async () => {
    mockNow = new Date(2026, 9, 21, 19, 30);
    await renderWithApp(<TodayScreen />, { keepState: true });
    await screen.findByText(/Good/);
    expect(screen.queryByText("Kén left you a few lines")).not.toBeOnTheScreen();
  });

  it("reads like a note, greets by name, then the card goes away", async () => {
    await act(async () => {
      await setPref("name", "Mai");
      for (const d of [17, 16, 15, 14, 13]) {
        await addMood({ mood: "heavy", tags: [], feelings: ["tired"] });
      }
    });
    await renderWithApp(<LetterScreen />, { keepState: true });
    expect(screen.getByText("Hi Mai,")).toBeOnTheScreen();
    expect(screen.getByText("See you this week.")).toBeOnTheScreen();
    expect(screen.queryByText(/\d/)).not.toBeOnTheScreen();
    expect(getPref("letterReadOn")).toBe("2026-10-18");
    await renderWithApp(<TodayScreen />, { keepState: true });
    expect(screen.queryByText("Kén left you a few lines")).not.toBeOnTheScreen();
  });

  it("can be turned off in Settings", async () => {
    await renderWithApp(<SettingsScreen />, { keepState: true });
    const toggle = screen.getByRole("switch", { name: "A note from Kén on Sunday evenings" });
    expect(toggle.props.value).toBe(true);
    await act(async () => fireEvent(toggle, "valueChange", false));
    expect(getPref("weeklyLetter")).toBe(false);
    await renderWithApp(<TodayScreen />, { keepState: true });
    expect(screen.queryByText("Kén left you a few lines")).not.toBeOnTheScreen();
  });
});

describe("The Sunday notification", () => {
  it("is scheduled weekly on Sunday 19:00, saying nothing private, when notifications are allowed", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ granted: true });
    await syncLetterNotification(en);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "mindcocoon-letter",
        content: expect.objectContaining({ body: "Kén left you a few lines.", data: { url: "/letter" } }),
        trigger: expect.objectContaining({ weekday: 1, hour: 19, minute: 0 }),
      }),
    );
  });

  it("never asks for permission by itself; without it, nothing is scheduled", async () => {
    await syncLetterNotification(en);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("is cancelled when the letter is turned off", async () => {
    await act(() => setPref("weeklyLetter", false));
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ granted: true });
    await syncLetterNotification(en);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith("mindcocoon-letter");
  });
});
