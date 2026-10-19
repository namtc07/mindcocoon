import { act, fireEvent, screen, userEvent } from "@testing-library/react-native";
import { ScrollView } from "react-native";
import TodayScreen from "@/app/(tabs)/index";
import { FeelingChips } from "@/components/mood/FeelingChips";
import { ARC_MIDDLE, MoodPicker } from "@/components/mood/MoodPicker";
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

  it("lies in one arc from heavier to lighter, not a grid", async () => {
    await renderWithApp(<MoodPicker variant="orbs" value={null} onChange={() => {}} label="How are you?" />);
    expect(screen.getAllByRole("radio").map((r) => r.props.accessibilityLabel)).toEqual([
      "Angry", "Confused", "Anxious", "Lonely", "Heavy", "Numb", "Peaceful", "Hopeful", "Thankful", "Joyful",
    ]);
    expect(screen.queryByText("More energy", { includeHiddenElements: true })).toBeNull();
    expect(screen.queryByText("Pleasant", { includeHiddenElements: true })).toBeNull();
  });

  it("tapping an orb chooses it and glides it to the middle of the arc", async () => {
    const user = userEvent.setup();
    const scrollTo = ScrollView.prototype.scrollTo as unknown as jest.Mock;
    scrollTo.mockClear();
    const onChange = jest.fn();
    await renderWithApp(<MoodPicker variant="orbs" value={null} onChange={onChange} label="How are you?" />);
    await user.press(screen.getByRole("radio", { name: "Hopeful" }));
    expect(onChange).toHaveBeenCalledWith("hopeful");
    // The arc repeats the ten moods; choices glide within the middle copy.
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ x: (ARC_MIDDLE * 10 + 7) * 76 }));
  });

  it("swiping only browses; nothing is chosen until a tap", async () => {
    const onChange = jest.fn();
    await renderWithApp(<MoodPicker variant="orbs" value={null} onChange={onChange} label="How are you?" />);
    await act(async () =>
      fireEvent(screen.getByTestId("feeling-arc"), "momentumScrollEnd", { nativeEvent: { contentOffset: { x: 2 * 76, y: 0 } } }),
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("never runs out: after swiping far, it quietly returns to the same mood in the middle", async () => {
    const scrollTo = ScrollView.prototype.scrollTo as unknown as jest.Mock;
    await renderWithApp(<MoodPicker variant="orbs" value={null} onChange={() => {}} label="How are you?" />);
    scrollTo.mockClear();
    await act(async () =>
      fireEvent(screen.getByTestId("feeling-arc"), "momentumScrollEnd", { nativeEvent: { contentOffset: { x: (ARC_MIDDLE * 10 + 22) * 76, y: 0 } } }),
    );
    expect(scrollTo).toHaveBeenLastCalledWith({ x: (ARC_MIDDLE * 10 + 2) * 76, animated: false });
  });

  it("labels are never cut off: the label does not grow with the orb", async () => {
    await renderWithApp(<MoodPicker variant="orbs" value="peaceful" onChange={() => {}} label="How are you?" />);
    expect(screen.getByTestId("feeling-arc")).toHaveProp("contentContainerStyle", expect.objectContaining({ paddingBottom: expect.any(Number) }));
  });

  it("says a few words about the chosen mood, and invites a swipe or tap before", async () => {
    const { rerender } = await renderWithApp(<MoodPicker variant="orbs" value={null} onChange={() => {}} label="How are you?" />);
    expect(screen.getByText("Swipe to see more, tap the one closest to now")).toBeOnTheScreen();
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
