/** In-memory stand-in for expo-sqlite/kv-store (string values only, like the real one). */
export class FakeKvStore {
  data = new Map<string, string>();
  async getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  async setItem(key: string, value: string) {
    if (typeof value !== "string") throw new TypeError("kv-store values must be strings");
    this.data.set(key, value);
  }
  async removeItem(key: string) {
    this.data.delete(key);
  }
  async getAllKeys() {
    return [...this.data.keys()];
  }
}
