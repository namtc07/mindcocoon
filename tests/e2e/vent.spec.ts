import { dumpIndexedDB, expect, test } from "./fixtures";

test("releasing leaves no trace", async ({ page }) => {
  await page.goto("/en/vent", { waitUntil: "networkidle" });
  const editor = page.getByRole("textbox", { name: /write what's on your mind/i });
  await editor.fill("words that should vanish forever");
  await page.getByRole("button", { name: "Release into the void" }).click();
  await expect(page.getByText("Let go.")).toBeVisible({ timeout: 6000 });

  await page.reload();
  await expect(page.getByRole("textbox", { name: /write what's on your mind/i })).toHaveValue("");
  expect(await dumpIndexedDB(page)).not.toContain("vanish forever");
});
