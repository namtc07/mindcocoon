import { act, screen, userEvent, within } from "@testing-library/react-native";
import SanctuaryScreen from "@/app/(tabs)/sanctuary";
import { audio } from "@/lib/audio";
import { setPref } from "@/lib/prefs";
import { renderWithApp } from "@/test-utils/render";

beforeEach(async () => {
  await act(async () => {
    audio.reset();
    await setPref("sanctuaryTab", undefined);
  });
});

describe("Colour noise", () => {
  it("white, pink and brown noise have their own small group in Sounds", async () => {
    await renderWithApp(<SanctuaryScreen />);
    const group = screen.getByTestId("noise-group");
    expect(within(group).getByText("Steady noise")).toBeOnTheScreen();
    for (const name of ["White noise", "Pink noise", "Brown noise"]) expect(within(group).getByRole("button", { name: `Play: ${name}` })).toBeOnTheScreen();
  });

  it("brown noise plays and mixes with rain", async () => {
    const user = userEvent.setup();
    await renderWithApp(<SanctuaryScreen />);
    await user.press(screen.getByRole("button", { name: "Play: Brown noise" }));
    await user.press(screen.getByRole("button", { name: "Play: Rain" }));
    expect([...audio.getState().playing].sort()).toEqual(["brown-noise", "rain"]);
    expect(await screen.findByLabelText("Volume for Brown noise")).toBeOnTheScreen();
  });
});
