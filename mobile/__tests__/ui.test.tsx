import { act, render, screen, userEvent } from "@testing-library/react-native";
import { renderWithApp } from "@/test-utils/render";
import { Text } from "react-native";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TextField } from "@/components/ui/TextField";
import { ToastHost, toast } from "@/components/ui/Toast";

describe("UI kit", () => {
  it("Button presses and respects disabled", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(
      <>
        <Button onPress={onPress}>Save</Button>
        <Button onPress={onPress} disabled>
          Nope
        </Button>
      </>,
    );
    await user.press(screen.getByRole("button", { name: "Save" }));
    await user.press(screen.getByRole("button", { name: "Nope" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Nope" })).toBeDisabled();
  });

  it("Chip exposes its selected state", async () => {
    await render(
      <Chip selected onPress={() => {}}>
        Work
      </Chip>,
    );
    expect(screen.getByRole("button", { name: "Work" })).toBeSelected();
  });

  it("TextField is found by its label", async () => {
    const user = userEvent.setup();
    const onChangeText = jest.fn();
    await render(<TextField label="Title" value="" onChangeText={onChangeText} />);
    await user.type(screen.getByLabelText("Title"), "hi");
    expect(onChangeText).toHaveBeenLastCalledWith("i");
  });

  it("Toast shows a message and hides it again", async () => {
    jest.useFakeTimers();
    await renderWithApp(
      <>
        <Text>page</Text>
        <ToastHost />
      </>,
    );
    await act(async () => toast.show("Saved"));
    expect(screen.getByText("Saved")).toBeOnTheScreen();
    await act(async () => jest.advanceTimersByTime(3_000));
    expect(screen.queryByText("Saved")).not.toBeOnTheScreen();
    jest.useRealTimers();
  });
});

describe("activity", () => {
  it("counts typing as activity for the auto-lock", async () => {
    const { appAutoLock } = require("@/lib/app-auto-lock");
    const mark = jest.spyOn(appAutoLock, "markActivity");
    const { TextField } = require("@/components/ui/TextField");
    const user = userEvent.setup();
    await renderWithApp(<TextField label="Field" value="" onChangeText={() => {}} />);
    await user.type(screen.getByLabelText("Field"), "a");
    expect(mark).toHaveBeenCalled();
  });
});
