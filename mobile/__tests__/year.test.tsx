import { screen, userEvent } from "@testing-library/react-native";
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
