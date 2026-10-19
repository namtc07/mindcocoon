import { act, fireEvent, screen, within } from "@testing-library/react-native";
import TodayScreen from "@/app/(tabs)/index";
import SettingsScreen from "@/app/settings";
import { getPref, setPref } from "@/lib/prefs";
import { renderWithApp } from "@/test-utils/render";
import { fonts } from "@/theme/fonts";

let mockNow = new Date(2026, 9, 19, 10, 0);
jest.mock("@/hooks/use-now", () => ({ useNow: () => mockNow }));

const flat = (style: unknown) => Object.assign({}, ...[style].flat(4).filter(Boolean));
const order = () => screen.getAllByTestId(/^today-/).map((n) => n.props.testID);

afterEach(async () => {
  await act(() => setPref("writingPrompts", undefined));
});

describe("Writing ideas on Today", () => {
  it("are a small, quiet card, not a big headline", async () => {
    await renderWithApp(<TodayScreen />);
    const card = screen.getByTestId("today-prompt");
    expect(within(card).getByText("Want to write more? One idea:")).toBeOnTheScreen();
    const idea = within(card).getByTestId("prompt-text");
    expect(flat(idea.props.style).fontSize).toBeLessThanOrEqual(17);
    expect(flat(idea.props.style).fontFamily).not.toBe(fonts.serif);
  });

  it("come after the check-in by day, and last in the evening", async () => {
    mockNow = new Date(2026, 9, 19, 10, 0);
    await renderWithApp(<TodayScreen />);
    expect(order()).toEqual(["today-checkin", "today-prompt", "today-entries"]);
    mockNow = new Date(2026, 9, 19, 21, 0);
    await renderWithApp(<TodayScreen />);
    expect(order()).toEqual(["today-checkin", "today-entries", "today-prompt"]);
    mockNow = new Date(2026, 9, 19, 10, 0);
  });

  it("can be turned off in Settings", async () => {
    await renderWithApp(<SettingsScreen />);
    const toggle = screen.getByRole("switch", { name: "Writing ideas on Today" });
    expect(toggle.props.value).toBe(true);
    await act(async () => fireEvent(toggle, "valueChange", false));
    expect(getPref("writingPrompts")).toBe(false);
    await renderWithApp(<TodayScreen />);
    expect(screen.queryByTestId("today-prompt")).not.toBeOnTheScreen();
  });
});
