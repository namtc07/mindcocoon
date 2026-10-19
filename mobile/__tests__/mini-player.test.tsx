import { act, screen, userEvent } from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";
import SanctuaryScreen from "@/app/(tabs)/sanctuary";
import { MiniPlayer } from "@/components/sanctuary/MiniPlayer";
import { EntryLinks } from "@/components/today/EntryLinks";
import { audio } from "@/lib/audio";
import { renderWithApp } from "@/test-utils/render";

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

  it("Sanctuary opens the requested part", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ section: "tonight" });
    try {
      await renderWithApp(<SanctuaryScreen />);
      expect(screen.getByRole("tab", { name: "Sounds" })).toBeSelected();
      expect(screen.getByText("Tonight's music")).toBeOnTheScreen();
      expect(router.setParams).toHaveBeenCalledWith({ section: undefined });
    } finally {
      (useLocalSearchParams as jest.Mock).mockReturnValue({});
    }
  });
});
