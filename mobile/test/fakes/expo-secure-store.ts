/** In-memory stand-in for expo-secure-store. */
export const AFTER_FIRST_UNLOCK = 0;

export class FakeSecureStore {
  data = new Map<string, string>();
  lastOptions: unknown;
  async getItemAsync(key: string) {
    return this.data.get(key) ?? null;
  }
  async setItemAsync(key: string, value: string, options?: unknown) {
    this.lastOptions = options;
    this.data.set(key, value);
  }
  async deleteItemAsync(key: string) {
    this.data.delete(key);
  }
}
