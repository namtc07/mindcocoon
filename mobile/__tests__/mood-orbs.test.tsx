import { screen, userEvent } from "@testing-library/react-native";
import TodayScreen from "@/app/(tabs)/index";
import { FeelingChips } from "@/components/mood/FeelingChips";
import { MoodPicker } from "@/components/mood/MoodPicker";
import { renderWithApp } from "@/test-utils/render";
import { readableFill } from "@/theme/contrast";
import { tokens } from "@/theme/tokens";

describe("Mood orbs", () => {
  it("keeps the five radio names and the selection", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await renderWithApp(<MoodPicker variant="orbs" value="heavy" onChange={onChange} label="How are you?" />);
    // RNTL cannot query the radiogroup role on a plain View (like listitem); its label still names the group.
    expect(screen.getByLabelText("How are you?")).toHaveProp("accessibilityRole", "radiogroup");
    expect(screen.getByRole("radio", { name: "Heavy" })).toBeChecked();
    await user.press(screen.getByRole("radio", { name: "Anxious" }));
    expect(onChange).toHaveBeenCalledWith("anxious");
  });

  it("lies in one gentle arc from heavier to lighter, not a grid", async () => {
    await renderWithApp(<MoodPicker variant="orbs" value={null} onChange={() => {}} label="How are you?" />);
    expect(screen.getAllByRole("radio").map((r) => r.props.accessibilityLabel)).toEqual(["Heavy", "Anxious", "Numb", "Peaceful", "Hopeful"]);
    expect(screen.queryByText("More energy", { includeHiddenElements: true })).toBeNull();
    expect(screen.queryByText("Pleasant", { includeHiddenElements: true })).toBeNull();
  });

  it("says a few words about the chosen mood, and invites a tap before", async () => {
    const { rerender } = await renderWithApp(<MoodPicker variant="orbs" value={null} onChange={() => {}} label="How are you?" />);
    expect(screen.getByText("Tap the one closest to now")).toBeOnTheScreen();
    await rerender(<MoodPicker variant="orbs" value="heavy" onChange={() => {}} label="How are you?" />);
    expect(screen.getByText("Weighed down, tired")).toBeOnTheScreen();
  });

  it("Today checks in with the orbs", async () => {
    await renderWithApp(<TodayScreen />);
    expect(screen.getByTestId("feeling-orbs")).toBeOnTheScreen();
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
