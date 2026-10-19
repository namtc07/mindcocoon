import { act, screen, userEvent } from "@testing-library/react-native";
import TodayScreen from "@/app/(tabs)/index";
import { getPref, setPref } from "@/lib/prefs";
import { markSleepNight } from "@/lib/sleep-log";
import { renderWithApp } from "@/test-utils/render";

let mockNow = new Date(2026, 9, 21, 8, 0);
jest.mock("@/hooks/use-now", () => ({ useNow: () => mockNow }));

beforeEach(async () => {
  await renderWithApp(<></>);
  await act(() => setPref("sleepLog", undefined));
});

describe("The morning after", () => {
  it("after a wind-down night, the morning asks how you slept, once", async () => {
    const user = userEvent.setup();
    await act(() => markSleepNight(new Date(2026, 9, 20, 23, 0), true));
    mockNow = new Date(2026, 9, 21, 8, 0);
    await renderWithApp(<TodayScreen />, { keepState: true });
    expect(screen.getByText("How did you sleep?")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Slept well" }));
    expect(getPref("sleepLog")?.[0]).toMatchObject({ night: "2026-10-20", quality: "good" });
    expect(await screen.findByText("Thank you. Noted, quietly.")).toBeOnTheScreen();
    await renderWithApp(<TodayScreen />, { keepState: true });
    expect(screen.queryByText("How did you sleep?")).not.toBeOnTheScreen();
  });

  it("no question without a sleep night", async () => {
    mockNow = new Date(2026, 9, 21, 8, 0);
    await renderWithApp(<TodayScreen />, { keepState: true });
    await screen.findByText(/Good/);
    expect(screen.queryByText("How did you sleep?")).not.toBeOnTheScreen();
  });
});
