import { expect, test } from "./fixtures";

test("a one-tap check-in shows on the week strip", async ({ page }) => {
  await page.goto("/en", { waitUntil: "networkidle" });
  await page.getByRole("radio", { name: "Hopeful" }).click();
  await expect(page.getByText("Saved for today")).toBeVisible();

  await page.goto("/en/mood");
  const week = page.getByRole("list", { name: "This week" });
  await expect(week.getByRole("listitem").last().locator("[data-mood]")).toHaveAttribute("data-mood", "hopeful");
});
