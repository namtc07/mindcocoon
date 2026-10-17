import { act, fireEvent, screen, userEvent } from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import SanctuaryScreen from "@/app/(tabs)/sanctuary";
import { MiniPlayer } from "@/components/sanctuary/MiniPlayer";
import { EntryLinks } from "@/components/today/EntryLinks";
import { audio } from "@/lib/audio";
import { renderWithApp } from "@/test-utils/render";
import { space } from "@/theme/tokens";

beforeEach(async () => {
  jest.clearAllMocks();
  await act(async () => audio.reset());
});

describe("Mini player", () => {
  it("hidden when nothing plays", async () => {
    await renderWithApp(<MiniPlayer />);
    expect(screen.queryByLabelText("Now playing")).not.toBeOnTheScreen();
  });

  it("shows the mix and pauses everything", async () => {
    const user = userEvent.setup();
    await act(() => audio.play("rain"));
    await act(() => audio.play("ocean"));
    await renderWithApp(<MiniPlayer />);
    expect(screen.getByLabelText("Now playing")).toBeOnTheScreen();
    expect(screen.getByText("Rain + Ocean")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Pause" }));
    expect(audio.getState().held).toEqual(["rain", "ocean"]);
    await user.press(screen.getByRole("button", { name: "Resume" }));
    expect(audio.getState().playing).toEqual(["rain", "ocean"]);
  });

  it("Stop clears it", async () => {
    const user = userEvent.setup();
    await act(() => audio.play("rain"));
    await renderWithApp(<MiniPlayer />);
    await user.press(screen.getByRole("button", { name: "Stop all" }));
    expect(audio.getState().playing).toEqual([]);
    expect(screen.queryByLabelText("Now playing")).not.toBeOnTheScreen();
  });

  it("shows minutes left on the sleep timer", async () => {
    await act(() => audio.play("rain"));
    await act(async () => audio.setSleepTimer(30));
    await renderWithApp(<MiniPlayer />);
    expect(screen.getByLabelText("Sleep timer: 30 min")).toBeOnTheScreen();
  });

  it("names open Sanctuary", async () => {
    const user = userEvent.setup();
    await act(() => audio.play("rain"));
    await renderWithApp(<MiniPlayer />);
    await user.press(screen.getByRole("link", { name: "Rain" }));
    expect(router.navigate).toHaveBeenCalledWith("/sanctuary");
  });
});

describe("Links into Sanctuary", () => {
  it("Today's Breathe link opens Sanctuary at breathing", async () => {
    const user = userEvent.setup();
    await renderWithApp(<EntryLinks />);
    await user.press(screen.getByRole("link", { name: /Breathe for a minute/ }));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/sanctuary", params: { section: "breathe" } });
    await user.press(screen.getByRole("link", { name: /Tonight's music/ }));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/sanctuary", params: { section: "tonight" } });
  });

  it("Sanctuary scrolls to the requested section", async () => {
    const scrollTo = ScrollView.prototype.scrollTo as unknown as jest.Mock;
    (useLocalSearchParams as jest.Mock).mockReturnValue({ section: "tonight" });
    try {
      await renderWithApp(<SanctuaryScreen />);
      await act(async () => fireEvent(screen.getByTestId("section-tonight"), "layout", { nativeEvent: { layout: { x: 0, y: 640, width: 390, height: 120 } } }));
      expect(scrollTo).toHaveBeenCalledWith({ y: 640 - space.lg, animated: true });
      expect(router.setParams).toHaveBeenCalledWith({ section: undefined });
    } finally {
      (useLocalSearchParams as jest.Mock).mockReturnValue({});
    }
  });
});
