import { act, screen, userEvent } from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";
import SanctuaryScreen from "@/app/(tabs)/sanctuary";
import { audio } from "@/lib/audio";
import { getPref, setPref } from "@/lib/prefs";
import { renderWithApp } from "@/test-utils/render";

const HIDDEN = { includeHiddenElements: true };

beforeEach(async () => {
  await act(async () => {
    audio.reset();
    await setPref("sanctuaryTab", undefined);
  });
});

describe("Sanctuary look", () => {
  it("opens on Sounds, and the three parts switch without a long scroll", async () => {
    const user = userEvent.setup();
    await renderWithApp(<SanctuaryScreen />);
    expect(screen.getByRole("tab", { name: "Sounds" })).toBeSelected();
    expect(screen.getByRole("button", { name: "Play: Rain" })).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Begin" })).not.toBeOnTheScreen();
    await user.press(screen.getByRole("tab", { name: "Breathe" }));
    expect(screen.getByRole("button", { name: "Begin" })).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Play: Rain" })).not.toBeOnTheScreen();
    await user.press(screen.getByRole("tab", { name: "Practices" }));
    expect(screen.getByText("5-4-3-2-1 grounding")).toBeOnTheScreen();
  });

  it("remembers the part you were on", async () => {
    const user = userEvent.setup();
    await renderWithApp(<SanctuaryScreen />);
    await user.press(screen.getByRole("tab", { name: "Breathe" }));
    expect(getPref("sanctuaryTab")).toBe("breathe");
  });

  it("links from Today open the right part", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ section: "breathe" });
    try {
      await renderWithApp(<SanctuaryScreen />);
      expect(screen.getByRole("tab", { name: "Breathe" })).toBeSelected();
      expect(router.setParams).toHaveBeenCalledWith({ section: undefined });
    } finally {
      (useLocalSearchParams as jest.Mock).mockReturnValue({});
    }
  });

  it("only sounds that are playing show a volume slider", async () => {
    const user = userEvent.setup();
    await renderWithApp(<SanctuaryScreen />);
    expect(screen.queryByLabelText("Volume for Rain")).not.toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Play: Rain" }));
    expect(await screen.findByLabelText("Volume for Rain")).toBeOnTheScreen();
    expect(screen.queryByLabelText("Volume for Ocean")).not.toBeOnTheScreen();
  });

  it("the picture at the top follows what is playing", async () => {
    const user = userEvent.setup();
    await renderWithApp(<SanctuaryScreen />);
    expect(screen.queryByTestId("sanctuary-hero-rain", HIDDEN)).not.toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Rainy night" }));
    expect(await screen.findByTestId("sanctuary-hero-rain", HIDDEN)).toBeOnTheScreen();
  });
});
