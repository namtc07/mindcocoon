import { act, screen, userEvent } from "@testing-library/react-native";
import { setPref } from "@/lib/prefs";
import TodayScreen from "@/app/(tabs)/index";
import { renderWithApp } from "@/test-utils/render";

let mockNow = new Date(2026, 9, 19, 17, 59, 50);
jest.mock("@/hooks/use-now", () => ({ useNow: () => mockNow }));

it("a note being typed survives the switch at 18:00", async () => {
  const user = userEvent.setup();
  await renderWithApp(<TodayScreen />);
  await user.press(await screen.findByRole("radio", { name: "Heavy" }));
  await user.press(await screen.findByRole("button", { name: "Add tags or a note" }));
  await user.type(screen.getByLabelText("A few words, if you want"), "long day");
  mockNow = new Date(2026, 9, 19, 18, 0, 5);
  // Any update re-renders Today with the new time (a re-render, not a remount).
  await act(() => setPref("theme", "mist"));
  expect(screen.getAllByTestId(/^today-/)[0].props.testID).toBe("today-checkin");
  expect(screen.getByLabelText("A few words, if you want")).toHaveDisplayValue("long day");
});
