import { expect, test } from "./fixtures";

test.describe("locale", () => {
  test.use({ locale: "vi-VN" });

  test("sends Vietnamese browsers to /vi", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/vi$/);
    await expect(page.getByRole("link", { name: "Viết về điều này" })).toBeVisible();
  });
});

test("keeps English for other browsers", async ({ page }) => {
  await page.goto("/vent");
  await expect(page).toHaveURL(/\/en\/vent$/);
});
