import { addMood } from "@mindcocoon/core/mood/store";
import { initVault } from "@mindcocoon/core/vault/session";
import { act, screen, userEvent, waitFor, within } from "@testing-library/react-native";
import * as Sharing from "expo-sharing";
import { captureRef, releaseCapture } from "react-native-view-shot";
import MoodScreen from "@/app/(tabs)/mood";
import { finishModalDismissals } from "@/test-utils/modals";
import { renderWithApp } from "@/test-utils/render";

async function setup() {
  await renderWithApp(<></>);
  await act(async () => {
    await initVault();
    await addMood({ mood: "heavy", tags: ["work"], note: "secret note", feelings: ["lonely", "sad"] });
    await addMood({ mood: "heavy", tags: [], feelings: ["lonely"] });
  });
  const user = userEvent.setup();
  await renderWithApp(<MoodScreen />, { keepState: true });
  await user.press(await screen.findByRole("button", { name: "Keep a picture of this month" }));
  return user;
}

describe("Journey picture", () => {
  it("the card has colours and feeling words, no notes or counts", async () => {
    await setup();
    const card = await screen.findByTestId("journey-card");
    expect(card).toBeOnTheScreen();
    expect(within(card).getByText("lonely, sad")).toBeOnTheScreen();
    expect(within(card).queryByText(/secret note/)).not.toBeOnTheScreen();
    const year = String(new Date().getFullYear());
    const withDigits = within(card)
      .queryAllByText(/\d/)
      .map((n) => String(n.props.children))
      .filter((text) => /\d/.test(text.replace(year, "")) && text.length < 40);
    expect(withDigits).toEqual([]);
  });

  it("share is called with the captured file, which is then released", async () => {
    const user = await setup();
    await user.press(await screen.findByRole("button", { name: "Save or share" }));
    await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalledWith("file:///cache/journey.png", expect.anything()));
    expect(captureRef).toHaveBeenCalled();
    expect(releaseCapture).toHaveBeenCalledWith("file:///cache/journey.png");
    await finishModalDismissals();
  });
});
