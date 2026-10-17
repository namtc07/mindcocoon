import { act, screen, userEvent, waitFor } from "@testing-library/react-native";
import * as Notifications from "expo-notifications";
import SettingsScreen from "@/app/settings";
import { eraseEverything } from "@/lib/export";
import { getPref, setPref } from "@/lib/prefs";
import { renderWithApp } from "@/test-utils/render";

const schedule = Notifications.scheduleNotificationAsync as jest.Mock;
const cancel = Notifications.cancelScheduledNotificationAsync as jest.Mock;

beforeEach(async () => {
  jest.clearAllMocks();
  await act(() => setPref("reminder", undefined));
});

async function open(locale: "en" | "vi" = "en") {
  const user = userEvent.setup();
  await renderWithApp(<SettingsScreen />, { locale });
  return user;
}

describe("Evening reminder", () => {
  it("off by default", async () => {
    await open();
    expect(await screen.findByText("Evening reminder")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Off" })).toBeSelected();
    expect(schedule).not.toHaveBeenCalled();
  });

  it("turning it on asks permission and schedules daily at 22:00", async () => {
    const user = await open();
    await user.press(await screen.findByRole("button", { name: "22:00" }));
    await waitFor(() => expect(schedule).toHaveBeenCalled());
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledWith({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
    expect(schedule).toHaveBeenCalledWith({
      identifier: "mindcocoon-evening",
      content: { title: "MindCocoon", body: "A quiet place is here if today was heavy." },
      trigger: { type: "daily", hour: 22, minute: 0, channelId: "evening" },
    });
    expect(getPref("reminder")).toEqual({ hour: 22 });
    expect(screen.getByRole("button", { name: "22:00" })).toBeSelected();
  });

  it("denied permission leaves it off and explains", async () => {
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ granted: false, canAskAgain: false, status: "denied" });
    const user = await open();
    await user.press(await screen.findByRole("button", { name: "21:00" }));
    expect(await screen.findByText("Notifications are off for MindCocoon in your phone's settings.")).toBeOnTheScreen();
    expect(schedule).not.toHaveBeenCalled();
    expect(getPref("reminder")).toBeUndefined();
    expect(screen.getByRole("button", { name: "Off" })).toBeSelected();
  });

  it("changing the hour replaces the schedule", async () => {
    const user = await open();
    await user.press(await screen.findByRole("button", { name: "21:00" }));
    await waitFor(() => expect(schedule).toHaveBeenCalledTimes(1));
    await user.press(screen.getByRole("button", { name: "23:00" }));
    await waitFor(() => expect(schedule).toHaveBeenCalledTimes(2));
    expect(cancel).toHaveBeenCalledWith("mindcocoon-evening");
    expect(schedule.mock.calls[1][0].trigger.hour).toBe(23);
  });

  it("turning it off cancels", async () => {
    const user = await open();
    await user.press(await screen.findByRole("button", { name: "22:00" }));
    await waitFor(() => expect(schedule).toHaveBeenCalled());
    cancel.mockClear();
    await user.press(screen.getByRole("button", { name: "Off" }));
    await waitFor(() => expect(cancel).toHaveBeenCalledWith("mindcocoon-evening"));
    expect(getPref("reminder")).toBeNull();
  });

  it("copy follows the language", async () => {
    const user = await open("vi");
    await user.press(await screen.findByRole("button", { name: "22:00" }));
    await waitFor(() => expect(schedule).toHaveBeenCalled());
    expect(schedule.mock.calls[0][0].content.body).toBe("Nếu hôm nay nặng nề, ở đây có một góc yên tĩnh cho bạn.");
  });

  it("erase everything cancels it", async () => {
    await act(() => setPref("reminder", { hour: 22 }));
    await act(() => eraseEverything());
    expect(cancel).toHaveBeenCalledWith("mindcocoon-evening");
  });
});
