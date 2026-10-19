import { addMood } from "@mindcocoon/core/mood/store";
import { initVault } from "@mindcocoon/core/vault/session";
import { act, screen, userEvent, within } from "@testing-library/react-native";
import MoodScreen from "@/app/(tabs)/mood";
import { renderWithApp } from "@/test-utils/render";

describe("Mood tab layout", () => {
  it("puts gentle observations right after the check-in", async () => {
    await renderWithApp(<></>);
    await act(async () => {
      await initVault();
      for (let i = 0; i < 4; i++) await addMood({ mood: "anxious", tags: ["work"] });
    });
    // Insights need distinct days: give the check-ins four different days.
    const { getStorage } = jest.requireActual("@mindcocoon/core/storage/index") as typeof import("@mindcocoon/core/storage/index");
    await act(async () => {
      const logs = await getStorage().moods.list();
      await getStorage().moods.replaceAll(
        logs.map((l, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return { ...l, createdAt: d.toISOString() };
        }),
      );
      const { loadMoods } = jest.requireActual("@mindcocoon/core/mood/store") as typeof import("@mindcocoon/core/mood/store");
      await loadMoods(true);
    });
    await renderWithApp(<MoodScreen />, { keepState: true });
    const ids = (await screen.findAllByTestId(/^mood-/)).map((n) => n.props.testID);
    expect(ids).toEqual(["mood-checkin", "mood-insights", "mood-week", "mood-calendar", "mood-history"]);
  });

  it("history shows the latest five, then more on request", async () => {
    await renderWithApp(<></>);
    await act(async () => {
      await initVault();
      for (let i = 0; i < 8; i++) await addMood({ mood: "peaceful", tags: [] });
    });
    const user = userEvent.setup();
    await renderWithApp(<MoodScreen />, { keepState: true });
    const list = await screen.findByLabelText("History");
    expect(within(list).getAllByLabelText("Peaceful")).toHaveLength(5);
    await user.press(screen.getByRole("button", { name: "Show earlier check-ins" }));
    expect(within(screen.getByLabelText("History")).getAllByLabelText("Peaceful")).toHaveLength(8);
    expect(screen.queryByRole("button", { name: "Show earlier check-ins" })).not.toBeOnTheScreen();
  });
});
