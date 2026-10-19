import { addMood } from "@mindcocoon/core/mood/store";
import { act, screen, userEvent, within } from "@testing-library/react-native";
import MoodScreen from "@/app/(tabs)/mood";
import { renderWithApp } from "@/test-utils/render";
import { inkOn } from "@/theme/contrast";
import { tokens } from "@/theme/tokens";

const mockNow = new Date(2026, 9, 19, 21, 0);
jest.mock("@/hooks/use-now", () => ({ useNow: () => mockNow }));

const flat = (style: unknown) => Object.assign({}, ...[style].flat(4).filter(Boolean));

async function open() {
  await renderWithApp(<></>);
  await act(async () => {
    await addMood({ mood: "heavy", tags: [] });
  });
  await renderWithApp(<MoodScreen />, { keepState: true });
}

describe("Mood tab polish", () => {
  it("day numbers stay readable on every mood colour", async () => {
    await open();
    const today = await screen.findByRole("button", { name: /Heavy, Today/ });
    expect(flat(within(today).getByText("19").props.style).color).toBe(inkOn(tokens.dusk.mood.heavy));
  });

  it("days still to come are dimmed", async () => {
    await open();
    const later = await screen.findByRole("button", { name: /^Tuesday, October 20|20 October/ });
    expect(flat(later.props.style).opacity).toBeLessThan(1);
  });

  it("the year view keeps the colour legend", async () => {
    const user = userEvent.setup();
    await open();
    await user.press(await screen.findByRole("button", { name: "Year" }));
    expect(within(screen.getByLabelText("Legend")).getAllByRole("listitem")).toHaveLength(10);
  });

  it("tapping a month in the year view opens that month", async () => {
    const user = userEvent.setup();
    await open();
    await user.press(await screen.findByRole("button", { name: "Year" }));
    await user.press(screen.getByRole("button", { name: "Open March" }));
    expect(screen.queryByLabelText("Your year in colours")).not.toBeOnTheScreen();
    expect(screen.getByText(/March 2026/i)).toBeOnTheScreen();
  });
});
