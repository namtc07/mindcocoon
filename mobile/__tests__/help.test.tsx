import { HOTLINES, isOpenNow } from "@mindcocoon/core/safety/hotlines";
import { screen, userEvent, within } from "@testing-library/react-native";
import { Linking } from "react-native";
import HelpScreen from "@/app/help";
import { renderWithApp } from "@/test-utils/render";

describe("Help", () => {
  it("lists Vietnamese lines first in Vietnamese and calls with a tel: link", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderWithApp(<HelpScreen />, { locale: "vi" });
    const local = await screen.findByTestId("home-lines");
    const vn = HOTLINES.filter((h) => h.country === "VN");
    expect(within(local).getAllByRole("button", { name: /Gọi/ })).toHaveLength(vn.length);
    await user.press(within(local).getAllByRole("button", { name: /Gọi/ })[0]);
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/^tel:\d+$/));
  });

  it("puts lines answering now before closed ones", async () => {
    await renderWithApp(<HelpScreen />, { locale: "en" });
    const now = new Date();
    const names = screen.getAllByTestId("hotline-name").map((n) => n.props.children as string);
    const openFlags = names.map((name) => isOpenNow(HOTLINES.find((h) => h.name.en === name)!, now));
    expect(openFlags).toEqual([...openFlags].sort((a, b) => Number(b) - Number(a)));
    expect(screen.getByText("Find a helpline in your country")).toBeOnTheScreen();
  });
});
