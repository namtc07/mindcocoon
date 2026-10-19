import { render, screen } from "@testing-library/react-native";
import TodayScreen from "@/app/(tabs)/index";
import { Ken } from "@/components/art/Ken";
import { Sky } from "@/components/art/Sky";
import { renderWithApp } from "@/test-utils/render";

const HIDDEN = { includeHiddenElements: true };
let mockNow = new Date(2026, 1, 17, 9, 0); // Tết 2026, morning
jest.mock("@/hooks/use-now", () => ({ useNow: () => mockNow }));

describe("Seasonal touches", () => {
  it.each(["tet", "mid-autumn", "christmas", "new-year", "full-moon"] as const)("the sky can dress for %s", async (occasion) => {
    await render(<Sky part="night" occasion={occasion} />);
    expect(screen.getByTestId(`sky-${occasion}`, HIDDEN)).toBeOnTheScreen();
  });

  it("Kén can carry a lantern or wear a scarf", async () => {
    await render(
      <>
        <Ken accessory="lantern" />
        <Ken accessory="scarf" />
      </>,
    );
    expect(screen.getByTestId("ken-lantern", HIDDEN)).toBeOnTheScreen();
    expect(screen.getByTestId("ken-scarf", HIDDEN)).toBeOnTheScreen();
  });

  it("at Tết, Today's sky and Kén dress up, with a short wish", async () => {
    mockNow = new Date(2026, 1, 17, 9, 0);
    await renderWithApp(<TodayScreen />);
    expect(screen.getByTestId("sky-tet", HIDDEN)).toBeOnTheScreen();
    expect(screen.getByTestId("ken-lantern", HIDDEN)).toBeOnTheScreen();
    expect(screen.getByText("A gentle new year to you.")).toBeOnTheScreen();
  });

  it("an ordinary day has none of it", async () => {
    mockNow = new Date(2026, 10, 10, 9, 0);
    await renderWithApp(<TodayScreen />);
    expect(screen.queryByTestId(/^sky-(tet|mid-autumn|christmas|new-year|full-moon)$/, HIDDEN)).toBeNull();
  });
});
