import { act, screen, userEvent, within } from "@testing-library/react-native";
import { MixChips } from "@/components/sanctuary/MixChips";
import { audio } from "@/lib/audio";
import { renderWithApp } from "@/test-utils/render";

const HIDDEN = { includeHiddenElements: true };

afterEach(async () => {
  await act(async () => audio.reset());
});

describe("Mix cards", () => {
  it("show a picture for each preset and keep their names", async () => {
    await renderWithApp(<MixChips />);
    const cases = [
      ["Rainy night", "scene-rain"],
      ["By the fire", "scene-fire"],
      ["Sea breeze", "scene-sea"],
      ["Rain at sea", "scene-rain-sea"],
    ] as const;
    for (const [name, scene] of cases) {
      const card = screen.getByRole("button", { name });
      expect(within(card).getByTestId(scene, HIDDEN)).toBeOnTheScreen();
    }
  });

  it("mark the playing preset", async () => {
    const user = userEvent.setup();
    await renderWithApp(<MixChips />);
    await user.press(screen.getByRole("button", { name: "By the fire" }));
    expect(await screen.findByRole("button", { name: "By the fire", selected: true })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Rainy night" })).not.toBeSelected();
  });
});
