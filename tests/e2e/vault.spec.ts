import { dumpIndexedDB, expect, test } from "./fixtures";

test("save from vent, protect with a passcode, lock and unlock", async ({ page }) => {
  await page.goto("/en/vent", { waitUntil: "networkidle" });
  await page.getByRole("textbox", { name: /write what's on your mind/i }).fill("kept safely");
  await page.getByRole("button", { name: "Save to vault" }).click();
  await page.getByLabel("Title (optional)").fill("First");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Saved to your vault")).toBeVisible();
  expect(await dumpIndexedDB(page)).not.toContain("kept safely");

  await page.goto("/en/vault");
  await expect(page.getByText("First")).toBeVisible();
  await page.getByRole("button", { name: "Vault settings" }).click();
  await page.getByRole("button", { name: "Set a passcode" }).click();
  await page.getByLabel("New passcode", { exact: true }).fill("2468");
  await page.getByLabel("Type it again").fill("2468");
  await page.getByRole("button", { name: "Save passcode" }).click();
  await page.getByRole("checkbox", { name: "I've saved my recovery code" }).check();
  await page.getByRole("button", { name: "Done" }).click();

  await page.getByRole("button", { name: "Lock now" }).click();
  await expect(page.getByText("Your vault is locked")).toBeVisible();
  await page.getByLabel("Passcode").fill("2468");
  await page.getByRole("button", { name: "Unlock" }).click();
  await expect(page.getByText("First")).toBeVisible();
});
