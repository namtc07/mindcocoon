import { act, fireEvent, screen, userEvent } from "@testing-library/react-native";
import { usePathname } from "expo-router";
import TodayScreen from "@/app/(tabs)/index";
import { Welcome } from "@/components/onboarding/Welcome";
import { clearPrefs, getPref, setPref } from "@/lib/prefs";
import { renderWithApp } from "@/test-utils/render";

let mockNow = new Date(2026, 9, 19, 21, 0);
jest.mock("@/hooks/use-now", () => ({ useNow: () => mockNow }));

async function fresh() {
  await act(() => clearPrefs());
  await renderWithApp(<Welcome />);
}

afterEach(async () => {
  await act(() => clearPrefs());
});

describe("Welcome", () => {
  it("shows the promise and the disclaimer", async () => {
    await fresh();
    expect(await screen.findByText("A quiet place for heavy nights")).toBeOnTheScreen();
    expect(screen.getByText(/not a substitute for a doctor/)).toBeOnTheScreen();
  });

  it("walks through intents, a name and the reminder, then never shows again", async () => {
    const user = userEvent.setup();
    await fresh();
    await user.press(await screen.findByRole("button", { name: "Continue" }));
    await user.press(screen.getByRole("button", { name: "Sleeping better" }));
    await user.press(screen.getByRole("button", { name: "Understanding my feelings" }));
    await user.press(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByLabelText("What should we call you?"), "  Mai  ");
    await act(async () => fireEvent(screen.getByRole("switch", { name: "Remind me in the evening" }), "valueChange", true));
    await user.press(screen.getByRole("button", { name: "Begin" }));
    expect(getPref("firstRunSeen")).toBe(true);
    expect(getPref("intents")).toEqual(["sleep", "feelings"]);
    expect(getPref("name")).toBe("Mai");
    expect(getPref("reminder")).toEqual({ hour: 22 });
    expect(screen.queryByText("A quiet place for heavy nights")).not.toBeOnTheScreen();
  });

  it("skip still marks it seen", async () => {
    const user = userEvent.setup();
    await fresh();
    await user.press(await screen.findByRole("button", { name: "Skip" }));
    expect(getPref("firstRunSeen")).toBe(true);
    expect(getPref("name")).toBeUndefined();
  });

  it("people who already saw the old notice never see it", async () => {
    await act(() => clearPrefs());
    await act(() => setPref("firstRunSeen", true));
    await renderWithApp(<Welcome />);
    expect(screen.queryByText("A quiet place for heavy nights")).not.toBeOnTheScreen();
  });

  it("never covers Help", async () => {
    (usePathname as jest.Mock).mockReturnValue("/help");
    try {
      await fresh();
      expect(screen.queryByText("A quiet place for heavy nights")).not.toBeOnTheScreen();
    } finally {
      (usePathname as jest.Mock).mockReturnValue("/");
    }
  });
});

describe("Personal touches on Today", () => {
  it("greets by name", async () => {
    await act(() => setPref("name", "Mai"));
    await renderWithApp(<TodayScreen />);
    expect(screen.getByRole("header", { name: "Good evening, Mai" })).toBeOnTheScreen();
  });

  it("puts wind-down first at night for people who came for sleep", async () => {
    mockNow = new Date(2026, 9, 19, 23, 0);
    await act(() => setPref("intents", ["sleep"]));
    await renderWithApp(<TodayScreen />);
    expect(screen.getAllByTestId(/^today-/)[0].props.testID).toBe("today-entries");
  });
});
