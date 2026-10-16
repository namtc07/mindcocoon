import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, entries } from "idb-keyval";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VentView } from "@/components/modules/vent/vent-view";
import { getStorage } from "@/lib/storage";
import { __setIterationsForTests } from "@/lib/vault/keyring";
import { __resetVaultForTests, getVaultState } from "@/lib/vault/session";
import { renderWithProviders } from "../utils/render";

// Reduced motion keeps the dissolve short (600ms) and deterministic in jsdom.
vi.mock("framer-motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("framer-motion")>()),
  useReducedMotion: () => true,
}));

const SECRET = "secret words nobody should keep";

async function dumpEverything() {
  const kv = await entries(createStore("mindcocoon", "kv"));
  return JSON.stringify(kv) + JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage });
}

beforeEach(async () => {
  __setIterationsForTests(1_000);
  __resetVaultForTests();
  await getStorage().journal.clear();
});

describe("Vent", () => {
  it("releases text into the void without a trace", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(<VentView />);
    const editor = await screen.findByRole("textbox", { name: /write/i });
    await user.type(editor, SECRET);
    await user.click(screen.getByRole("button", { name: /release into the void/i }));

    expect(await screen.findByText("Let go.", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(await getStorage().journal.list()).toEqual([]);
    expect(await dumpEverything()).not.toContain("secret words");

    // Activity hides and re-shows the page: the released text must not come back.
    rerender(<VentView />);
    await user.click(await screen.findByRole("button", { name: /write again/i }));
    expect(await screen.findByRole("textbox", { name: /write/i })).toHaveValue("");
    expect(document.body.textContent).not.toContain("secret words");
  });

  it("disables release while empty", async () => {
    renderWithProviders(<VentView />);
    expect(await screen.findByRole("button", { name: /release into the void/i })).toBeDisabled();
  });

  it("saves to the vault encrypted", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VentView />);
    await user.type(await screen.findByRole("textbox", { name: /write/i }), SECRET);
    await user.click(screen.getByRole("button", { name: /save to vault/i }));
    await user.type(await screen.findByLabelText(/title/i), "t");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(async () => expect(await getStorage().journal.list()).toHaveLength(1));
    const [stored] = await getStorage().journal.list();
    expect(stored.content).toMatch(/^v1\./);
    expect(JSON.stringify(stored)).not.toContain("secret words");
    expect(getVaultState().entries[0]).toMatchObject({ title: "t", body: SECRET });
    expect(await screen.findByRole("textbox", { name: /write/i })).toHaveValue("");
  });
});
