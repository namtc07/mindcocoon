import { test as base, expect } from "@playwright/test";

/** Every spec starts past the one-time welcome dialog (it hides content from the a11y tree). */
export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.addInitScript(() => localStorage.setItem("mc:first-run-seen", "1"));
    await provide(page);
  },
});

export { expect };

/** Reads every value in the app's IndexedDB key-value store as JSON text. */
export async function dumpIndexedDB(page: import("@playwright/test").Page): Promise<string> {
  return page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        const open = indexedDB.open("mindcocoon");
        open.onsuccess = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains("kv")) return resolve("");
          const request = db.transaction("kv").objectStore("kv").getAll();
          request.onsuccess = () => resolve(JSON.stringify(request.result));
        };
        open.onerror = () => resolve("");
      }),
  );
}
