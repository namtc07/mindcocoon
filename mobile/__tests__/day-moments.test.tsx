import { getStorage } from "@mindcocoon/core/storage/index";
import { screen, userEvent } from "@testing-library/react-native";
import TodayScreen from "@/app/(tabs)/index";
import { renderWithApp } from "@/test-utils/render";

const stored = async () => (await getStorage().moods.list()).map((l) => l.mood);

describe("Moments in a day", () => {
  it("a second moment can be added later the same day; the day speaks with the latest", async () => {
    const user = userEvent.setup();
    await renderWithApp(<TodayScreen />);
    await user.press(await screen.findByRole("radio", { name: "Heavy" }));
    await user.press(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Today: Heavy");

    await user.press(screen.getByRole("button", { name: "Add another moment" }));
    await user.press(await screen.findByRole("radio", { name: "Peaceful" }));
    await user.press(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Today: Peaceful");

    // Both moments are kept — the morning one was not overwritten.
    expect(await stored()).toHaveLength(2);
    expect(await stored()).toEqual(expect.arrayContaining(["heavy", "peaceful"]));
  });
});
