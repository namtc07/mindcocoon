import { render, screen } from "@testing-library/react-native";
import * as Reanimated from "react-native-reanimated";
import TodayScreen from "@/app/(tabs)/index";
import { Scene } from "@/components/art/Scene";
import { Sky } from "@/components/art/Sky";
import { seeded } from "@/components/art/seeded";
import { renderWithApp } from "@/test-utils/render";

const HIDDEN = { includeHiddenElements: true };
let mockNow = new Date(2026, 9, 19, 23, 0);
jest.mock("@/hooks/use-now", () => ({ useNow: () => mockNow }));

describe("Skies and scenes", () => {
  it("seeded stars are the same each render", () => {
    const a = seeded(7);
    const b = seeded(7);
    const first = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(first);
    expect(first.every((x) => x >= 0 && x < 1)).toBe(true);
  });

  it("Sky shows stars only at night", async () => {
    const { rerender } = await render(<Sky part="night" />);
    expect(screen.getAllByTestId("star", HIDDEN).length).toBeGreaterThan(5);
    await rerender(<Sky part="afternoon" />);
    expect(screen.queryAllByTestId("star", HIDDEN)).toHaveLength(0);
    expect(screen.getByTestId("sky-afternoon", HIDDEN)).toBeOnTheScreen();
  });

  it("is hidden from screen readers", async () => {
    await render(<Sky part="night" />);
    expect(screen.getByTestId("sky-night", HIDDEN)).toHaveProp("accessibilityElementsHidden", true);
    expect(screen.getByTestId("sky-night", HIDDEN)).toHaveProp("importantForAccessibility", "no-hide-descendants");
  });

  it("does not twinkle under Reduce Motion", async () => {
    const reduce = jest.spyOn(Reanimated, "useReducedMotion").mockReturnValue(true);
    const repeat = jest.spyOn(Reanimated, "withRepeat");
    try {
      await render(<Sky part="night" />);
      expect(repeat).not.toHaveBeenCalled();
    } finally {
      reduce.mockRestore();
      repeat.mockRestore();
    }
  });

  it("twinkles a few stars otherwise", async () => {
    const repeat = jest.spyOn(Reanimated, "withRepeat");
    try {
      await render(<Sky part="night" />);
      expect(repeat).toHaveBeenCalled();
    } finally {
      repeat.mockRestore();
    }
  });

  it.each(["rain", "fire", "sea", "rain-sea"] as const)("draws the %s scene", async (kind) => {
    await render(<Scene kind={kind} />);
    expect(screen.getByTestId(`scene-${kind}`, HIDDEN)).toHaveProp("accessibilityElementsHidden", true);
  });

  it("Today shows the sky for the part of day", async () => {
    mockNow = new Date(2026, 9, 19, 9, 0);
    await renderWithApp(<TodayScreen />);
    expect(screen.getByTestId("sky-morning", HIDDEN)).toBeOnTheScreen();
  });
});
