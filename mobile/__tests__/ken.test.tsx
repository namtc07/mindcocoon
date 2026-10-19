import { screen } from "@testing-library/react-native";
import TodayScreen from "@/app/(tabs)/index";
import { Ken } from "@/components/art/Ken";
import { MoodHistory } from "@/components/mood/MoodHistory";
import { VaultList } from "@/components/vault/VaultList";
import { AfterRelease } from "@/components/vent/AfterRelease";
import { renderWithApp } from "@/test-utils/render";

const HIDDEN = { includeHiddenElements: true };
let mockNow = new Date(2026, 9, 19, 23, 30);
jest.mock("@/hooks/use-now", () => ({ useNow: () => mockNow }));

describe("Kén", () => {
  it("Today shows a sleepy Kén at night", async () => {
    await renderWithApp(<TodayScreen />);
    expect(screen.getByTestId("ken-sleepy", HIDDEN)).toBeOnTheScreen();
  });

  it("Today shows a calm Kén by day", async () => {
    mockNow = new Date(2026, 9, 19, 10, 0);
    await renderWithApp(<TodayScreen />);
    expect(screen.getByTestId("ken-calm", HIDDEN)).toBeOnTheScreen();
    mockNow = new Date(2026, 9, 19, 23, 30);
  });

  it("after release shows a glad Kén", async () => {
    await renderWithApp(<AfterRelease onWriteAgain={() => {}} />);
    expect(screen.getByTestId("ken-glad", HIDDEN)).toBeOnTheScreen();
  });

  it("an empty vault shows Kén", async () => {
    await renderWithApp(<VaultList entries={[]} onOpen={() => {}} />);
    expect(screen.getByTestId("ken-calm", HIDDEN)).toBeOnTheScreen();
  });

  it("an empty mood history shows Kén", async () => {
    await renderWithApp(<MoodHistory logs={[]} />);
    expect(screen.getByTestId("ken-calm", HIDDEN)).toBeOnTheScreen();
  });

  it("is hidden from screen readers", async () => {
    await renderWithApp(<Ken mood="glad" />);
    expect(screen.queryByTestId("ken-glad")).toBeNull();
    expect(screen.getByTestId("ken-glad", HIDDEN)).toHaveProp("accessibilityElementsHidden", true);
  });
});
