import { HOTLINES, isOpenNow, telHref } from "@mindcocoon/core/safety/hotlines";
import { screen, userEvent, within } from "@testing-library/react-native";
import { Linking } from "react-native";
import HelpScreen from "@/app/help";
import { renderWithApp } from "@/test-utils/render";

let mockRegion: string | null = "VN";
jest.mock("@/lib/region", () => ({ deviceRegion: () => mockRegion }));

describe("Help", () => {
  it("in Vietnam, Vietnamese lines come first and Call dials them", async () => {
    mockRegion = "VN";
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderWithApp(<HelpScreen />, { locale: "vi" });
    const local = await screen.findByTestId("home-lines");
    const vn = HOTLINES.filter((h) => h.country === "VN");
    expect(within(local).getAllByRole("button", { name: /Gọi/ })).toHaveLength(vn.length);
    await user.press(within(local).getAllByRole("button", { name: /Gọi/ })[0]);
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/^tel:[\d,]+$/));
  });

  it("follows the phone's region, not its language (English phone in the Philippines)", async () => {
    mockRegion = "PH";
    await renderWithApp(<HelpScreen />, { locale: "en" });
    const local = await screen.findByTestId("home-lines");
    expect(within(local).getByText("NCMH Crisis Hotline")).toBeOnTheScreen();
  });

  it("in a country we don't list yet, the find-a-helpline link comes first", async () => {
    mockRegion = "FR";
    await renderWithApp(<HelpScreen />, { locale: "en" });
    expect(screen.queryByTestId("home-lines")).not.toBeOnTheScreen();
    expect(screen.getByTestId("find-helpline-first")).toBeOnTheScreen();
  });

  it("other countries are grouped under their names, open lines first in each", async () => {
    mockRegion = "VN";
    await renderWithApp(<HelpScreen />, { locale: "en" });
    expect(screen.getByRole("header", { name: "Philippines" })).toBeOnTheScreen();
    const us = screen.getByTestId("country-US");
    const now = new Date();
    const names = within(us).getAllByTestId("hotline-name").map((n) => n.props.children as string);
    const openFlags = names.map((name) => isOpenNow(HOTLINES.find((h) => h.name.en === name)!, now));
    expect(openFlags).toEqual([...openFlags].sort((a, b) => Number(b) - Number(a)));
  });
});

it("dials extensions with a pause", () => {
  expect(telHref("119 ext. 8")).toBe("tel:119,8");
  expect(telHref("9-8-8")).toBe("tel:988");
  expect(telHref("096 306 1414")).toBe("tel:0963061414");
});
