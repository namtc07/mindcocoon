import { screen, userEvent } from "@testing-library/react-native";
import TodayScreen from "@/app/(tabs)/index";
import { FeelingChips } from "@/components/mood/FeelingChips";
import { MoodPicker } from "@/components/mood/MoodPicker";
import { renderWithApp } from "@/test-utils/render";
import { readableFill } from "@/theme/contrast";
import { tokens } from "@/theme/tokens";

describe("Mood meter", () => {
  it("keeps the five radio names and the selection", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await renderWithApp(<MoodPicker variant="meter" value="heavy" onChange={onChange} label="How are you?" />);
    // RNTL cannot query the radiogroup role on a plain View (like listitem); its label still names the group.
    expect(screen.getByLabelText("How are you?")).toHaveProp("accessibilityRole", "radiogroup");
    for (const name of ["Peaceful", "Hopeful", "Numb", "Heavy", "Anxious"]) expect(screen.getByRole("radio", { name })).toBeOnTheScreen();
    expect(screen.getByRole("radio", { name: "Heavy" })).toBeChecked();
    await user.press(screen.getByRole("radio", { name: "Anxious" }));
    expect(onChange).toHaveBeenCalledWith("anxious");
  });

  it("names its two directions", async () => {
    await renderWithApp(<MoodPicker variant="meter" value={null} onChange={() => {}} label="How are you?" />);
    for (const text of ["More energy", "Less energy", "Unpleasant", "Pleasant"]) expect(screen.getByText(text, { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it("Today checks in on the meter", async () => {
    await renderWithApp(<TodayScreen />);
    expect(screen.getByTestId("feelings-meter")).toBeOnTheScreen();
  });

  it("feeling tiles are tinted with the mood and still capped at three", async () => {
    const user = userEvent.setup();
    let value: string[] = [];
    const { rerender } = await renderWithApp(<FeelingChips mood="heavy" value={value} onChange={(v) => (value = v)} />);
    expect(screen.getAllByRole("button")).toHaveLength(8);
    for (const name of ["lonely", "sad", "homesick"]) {
      await user.press(screen.getByRole("button", { name }));
      await rerender(<FeelingChips mood="heavy" value={value} onChange={(v) => (value = v)} />);
    }
    expect(value).toEqual(["lonely", "sad", "homesick"]);
    expect(screen.getByRole("button", { name: "sad" })).toHaveStyle({ backgroundColor: readableFill(tokens.dusk.mood.heavy).background });
    expect(screen.getByRole("button", { name: "hurt" })).toBeDisabled();
  });
});

it("the meter's side labels shrink instead of pushing orbs out at large text sizes", async () => {
  await renderWithApp(<MoodPicker variant="meter" value={null} onChange={() => {}} label="How are you?" />);
  const side = screen.getByText("Pleasant", { includeHiddenElements: true });
  expect(side).toHaveStyle({ flex: 1 });
  expect(side.props.maxFontSizeMultiplier).toBeLessThanOrEqual(1.3);
  expect(screen.getByRole("radio", { name: "Numb" })).toHaveStyle({ flexShrink: 0, maxWidth: 104 });
});
