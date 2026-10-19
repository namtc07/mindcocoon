import { act, fireEvent, screen, userEvent } from "@testing-library/react-native";
import MoodScreen from "@/app/(tabs)/mood";
import { renderWithApp } from "@/test-utils/render";

it("the Year view shows twelve months of days", async () => {
  const user = userEvent.setup();
  await renderWithApp(<MoodScreen />);
  await user.press(await screen.findByRole("button", { name: "Year" }));
  const year = screen.getByLabelText("Your year in colours");
  expect(year).toBeOnTheScreen();
  expect(screen.getAllByTestId("year-month")).toHaveLength(12);
  await user.press(screen.getByRole("button", { name: "Month" }));
  expect(screen.queryByLabelText("Your year in colours")).not.toBeOnTheScreen();
});

it("year squares shrink to fit the row on a narrow phone", async () => {
  const user = userEvent.setup();
  await renderWithApp(<MoodScreen />);
  await user.press(await screen.findByRole("button", { name: "Year" }));
  const rows = screen.getAllByTestId("year-days");
  await act(async () => fireEvent(rows[0], "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 280, height: 10 } } }));
  const cells = screen.getAllByTestId("year-day");
  const flat = (style: unknown) => Object.assign({}, ...[style].flat(3).filter(Boolean));
  expect(flat(cells[0].props.style).width).toBe(Math.floor((280 - 30 * 2) / 31));
});
