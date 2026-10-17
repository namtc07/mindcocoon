import { getStorage } from "@mindcocoon/core/storage/index";
import { initVault, lockVault, setVaultPasscode } from "@mindcocoon/core/vault/session";
import { act, screen, userEvent, waitFor, within } from "@testing-library/react-native";
import { Alert } from "react-native";
import MoodScreen from "@/app/(tabs)/mood";
import { getPref } from "@/lib/prefs";
import { renderWithApp } from "@/test-utils/render";

async function setup() {
  const user = userEvent.setup();
  await renderWithApp(<></>);
  await act(() => initVault());
  await renderWithApp(<MoodScreen />, { keepState: true });
  return user;
}

async function checkIn(user: ReturnType<typeof userEvent.setup>) {
  const form = await screen.findByLabelText("Check in");
  await user.press(within(form).getByRole("radio", { name: "Anxious" }));
  await user.press(within(form).getByRole("button", { name: "Work" }));
  await user.press(within(form).getByRole("button", { name: "Study" }));
  await user.type(within(form).getByLabelText("Note"), "exam");
  await user.press(within(form).getByRole("button", { name: "Save check-in" }));
}

describe("Mood journey", () => {
  it("shows a check-in on the week strip, the month map and the day detail", async () => {
    const user = await setup();
    await checkIn(user);
    const week = await screen.findByLabelText("This week");
    await waitFor(() => expect(within(week).getAllByRole("listitem")[6]).toHaveAccessibleName(/anxious/i));
    const [log] = await getStorage().moods.list();
    expect(log.note).toMatch(/^v1\./);

    await user.press(screen.getByRole("button", { name: /anxious.*today/i }));
    expect(await screen.findByText("exam")).toBeOnTheScreen();
    expect(screen.getAllByText("Study").length).toBeGreaterThan(0);
  });

  it("hides decrypted notes in the day detail when the vault locks", async () => {
    const user = await setup();
    await act(() => setVaultPasscode("2468"));
    await checkIn(user);
    await waitFor(async () => expect(await getStorage().moods.list()).toHaveLength(1));
    await user.press(screen.getByRole("button", { name: /anxious.*today/i }));
    expect(await screen.findByText("exam")).toBeOnTheScreen();
    await act(async () => lockVault());
    await waitFor(() => expect(screen.queryByText("exam")).not.toBeOnTheScreen());
  });

  it("marks today on the month map and disables going past this month", async () => {
    await setup();
    expect(await screen.findByRole("button", { name: /today/i })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous month" })).toBeEnabled();
  });

  it("keeps a legend for all five moods", async () => {
    await setup();
    const legend = await screen.findByLabelText("Legend");
    expect(within(legend).getAllByRole("listitem")).toHaveLength(5);
  });

  it("remembers a custom tag", async () => {
    const user = await setup();
    const form = await screen.findByLabelText("Check in");
    await user.type(within(form).getByLabelText("Add your own"), "Exams");
    await user.press(within(form).getByRole("button", { name: "Add" }));
    expect(within(form).getByRole("button", { name: "Exams" })).toBeOnTheScreen();
    expect(getPref("customTags")).toEqual(["Exams"]);
  });

  it("removes a check-in from history after confirming", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.style === "destructive")?.onPress?.();
    });
    const user = await setup();
    await checkIn(user);
    const history = await screen.findByLabelText("History");
    await user.press(await within(history).findByRole("button", { name: "Delete check-in" }));
    expect(alert).toHaveBeenCalled();
    await waitFor(async () => expect(await getStorage().moods.list()).toEqual([]));
    await waitFor(() => expect(within(screen.getByLabelText("This week")).getAllByRole("listitem")[6]).not.toHaveAccessibleName(/anxious/i));
  });
});
