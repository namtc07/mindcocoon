import { expect, test } from "./fixtures";

test("the help page works offline", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "service worker offline check runs in Chromium");
  await page.goto("/en");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.goto("/en/help");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "You don't have to carry this alone" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Call" }).first()).toHaveAttribute("href", /^tel:/);
});
