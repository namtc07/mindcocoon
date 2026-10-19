import { act, render, screen, userEvent, waitFor, within } from "@testing-library/react-native";
import * as Reanimated from "react-native-reanimated";
import WindDownScreen from "@/app/wind-down";
import { AnimationsActive } from "@/components/art/activity";
import { Ken } from "@/components/art/Ken";
import { Scene } from "@/components/art/Scene";
import { Sky } from "@/components/art/Sky";
import { MixChips } from "@/components/sanctuary/MixChips";
import { audio } from "@/lib/audio";
import { setPref } from "@/lib/prefs";
import { renderWithApp } from "@/test-utils/render";

const HIDDEN = { includeHiddenElements: true };

afterEach(async () => {
  await act(async () => audio.reset());
});

/** Every `name` (id) of a given SVG host element in the rendered tree. */
function svgIds(type: string) {
  const ids: string[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(walk);
    const n = node as { type?: string; props?: { name?: string }; children?: unknown };
    if (n.type === type && n.props?.name) ids.push(n.props.name);
    walk(n.children);
  };
  walk(screen.toJSON());
  return ids;
}

it("each picture uses its own gradient ids", async () => {
  await render(
    <>
      <Scene kind="fire" />
      <Scene kind="sea" />
    </>,
  );
  const ids = svgIds("RNSVGLinearGradient");
  expect(ids).toHaveLength(2);
  expect(new Set(ids).size).toBe(2);
});

it("stars and Kén stop moving when their screen is not in front", async () => {
  const repeat = jest.spyOn(Reanimated, "withRepeat");
  try {
    await render(
      <AnimationsActive.Provider value={false}>
        <Sky part="night" />
        <Ken />
      </AnimationsActive.Provider>,
    );
    expect(repeat).not.toHaveBeenCalled();
  } finally {
    repeat.mockRestore();
  }
});

it("the playing mix card carries a check mark, not only a coloured border", async () => {
  const user = userEvent.setup();
  await renderWithApp(<MixChips />);
  await user.press(screen.getByRole("button", { name: "Sea breeze" }));
  const card = await screen.findByRole("button", { name: "Sea breeze", selected: true });
  expect(within(card).getByTestId("mix-check", HIDDEN)).toBeOnTheScreen();
  expect(within(screen.getByRole("button", { name: "Rainy night" })).queryByTestId("mix-check", HIDDEN)).toBeNull();
});

it("the goodnight picture follows what is actually playing", async () => {
  const user = userEvent.setup();
  await renderWithApp(<></>);
  await act(async () => {
    audio.reset();
    await setPref("breathing", undefined);
  });
  await renderWithApp(<WindDownScreen />, { keepState: true });
  await user.press(await screen.findByRole("radio", { name: "Anxious" }));
  await user.press(screen.getByRole("button", { name: "Next" }));
  await user.press(screen.getByRole("button", { name: "Next" }));
  await user.press(screen.getByRole("button", { name: "Goodnight" }));
  expect(await screen.findByTestId("scene-rain-sea", HIDDEN)).toBeOnTheScreen();
  await act(async () => audio.stopAll());
  await waitFor(() => expect(screen.queryByTestId("scene-rain-sea", HIDDEN)).toBeNull());
});
