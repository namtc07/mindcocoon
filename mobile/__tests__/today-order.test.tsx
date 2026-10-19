import { act, screen, within } from "@testing-library/react-native";
import { addWorry, __resetWorriesForTests } from "@/lib/worries";
import { initVault } from "@mindcocoon/core/vault/session";
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

  it("in the daytime: check-in, then a writing idea; letting it out leads, wind down last", async () => {
    await at(10);
    expect(order()).toEqual(["today-checkin", "today-prompt", "today-entries"]);
    expect(firstEntry()).toHaveAccessibleName(/Let it out/);
    const links = within(screen.getByTestId("today-entries")).getAllByRole("link");
    expect(links[links.length - 1]).toHaveAccessibleName(/Wind down for sleep/);
  });

  it("switches at 18:00 and 05:00", async () => {
    await at(18);
    expect(order()[0]).toBe("today-checkin");
    jest.useRealTimers();
    await at(5);
    expect(order()).toEqual(["today-checkin", "today-prompt", "today-entries"]);
  });

  it("a ready worry is reachable in the evening too", async () => {
    await renderWithApp(<></>);
    await act(async () => {
      await __resetWorriesForTests();
      await initVault();
      await addWorry("x", new Date(2026, 9, 18, 23, 0));
    });
    jest.useFakeTimers({ advanceTimers: true, now: new Date(2026, 9, 19, 21, 0) });
    await renderWithApp(<TodayScreen />, { keepState: true });
    expect(await screen.findByText("Something you set down is ready to look at.")).toBeOnTheScreen();
  });

});
