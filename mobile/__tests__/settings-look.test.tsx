import { screen, userEvent, within } from "@testing-library/react-native";
import { router } from "expo-router";
import SettingsScreen from "@/app/settings";
import { renderWithApp } from "@/test-utils/render";

describe("Settings, grouped like a phone's own settings", () => {
  it("has clear groups in a sensible order", async () => {
    await renderWithApp(<SettingsScreen />);
    const headers = screen.getAllByRole("header").map((h) => h.props.children);
    const order = ["You", "Appearance", "Evening reminder", "While you use it", "Vault", "Ads", "Your data", "About"];
    const positions = order.map((name) => headers.findIndex((h) => h === name));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("each choice sits in its group as a row", async () => {
    await renderWithApp(<SettingsScreen />);
    const appearance = screen.getByTestId("group-appearance");
    expect(within(appearance).getByRole("radio", { name: "English" })).toBeOnTheScreen();
    expect(within(appearance).getByRole("radio", { name: "Mist" })).toBeOnTheScreen();
    expect(within(appearance).getByRole("switch", { name: "Dim after 10 pm" })).toBeOnTheScreen();
    const using = screen.getByTestId("group-using");
    expect(within(using).getByRole("switch", { name: "Writing ideas on Today" })).toBeOnTheScreen();
    expect(within(using).getByRole("switch", { name: "Sound when letting go" })).toBeOnTheScreen();
  });

  it("rows that go somewhere are links", async () => {
    const user = userEvent.setup();
    await renderWithApp(<SettingsScreen />);
    await user.press(screen.getByRole("link", { name: "Passcode and recovery code" }));
    expect(router.navigate).toHaveBeenCalledWith("/vault");
    await user.press(screen.getByRole("link", { name: "Support lines" }));
    expect(router.push).toHaveBeenCalledWith("/help");
  });

  it("shows the app version at the bottom", async () => {
    await renderWithApp(<SettingsScreen />);
    expect(screen.getByText(/^MindCocoon \d+\.\d+\.\d+$/)).toBeOnTheScreen();
  });
});
