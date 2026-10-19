import { screen, within } from "@testing-library/react-native";
import TodayScreen from "@/app/(tabs)/index";
import { renderWithApp } from "@/test-utils/render";

async function at(hour: number) {
  jest.useFakeTimers({ advanceTimers: true, now: new Date(2026, 9, 19, hour, 0) });
  await renderWithApp(<TodayScreen />);
  await screen.findAllByTestId(/^today-/);
}

const order = () => screen.getAllByTestId(/^today-/).map((n) => n.props.testID);
const firstEntry = () => within(screen.getByTestId("today-entries")).getAllByRole("link")[0];

afterEach(() => jest.useRealTimers());

describe("Today order", () => {
  it("in the evening: check-in first, wind down leads, the prompt comes last", async () => {
    await at(21);
    expect(order()).toEqual(["today-checkin", "today-entries", "today-prompt"]);
    expect(firstEntry()).toHaveAccessibleName(/Wind down for sleep/);
  });

  it("in the daytime: the prompt first, letting it out leads, wind down last", async () => {
    await at(10);
    expect(order()).toEqual(["today-prompt", "today-checkin", "today-entries"]);
    expect(firstEntry()).toHaveAccessibleName(/Let it out/);
    const links = within(screen.getByTestId("today-entries")).getAllByRole("link");
    expect(links[links.length - 1]).toHaveAccessibleName(/Wind down for sleep/);
  });

  it("switches at 18:00 and 05:00", async () => {
    await at(18);
    expect(order()[0]).toBe("today-checkin");
    jest.useRealTimers();
    await at(5);
    expect(order()[0]).toBe("today-prompt");
  });
});
