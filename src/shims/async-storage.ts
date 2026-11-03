/** AsyncStorage on top of localStorage (same API shape the app code uses). */
const ls = () => { try { return window.localStorage; } catch { return null; } };

const AsyncStorage = {
  async getItem(key: string): Promise<string | null> { return ls()?.getItem(key) ?? null; },
  async setItem(key: string, value: string): Promise<void> { try { ls()?.setItem(key, value); } catch { /* quota */ } },
  async removeItem(key: string): Promise<void> { ls()?.removeItem(key); },
  async multiRemove(keys: string[]): Promise<void> { keys.forEach(k => ls()?.removeItem(k)); },
  async multiGet(keys: string[]): Promise<[string, string | null][]> { return keys.map(k => [k, ls()?.getItem(k) ?? null]); },
  async getAllKeys(): Promise<string[]> { const s = ls(); return s ? Object.keys(s) : []; },
  async clear(): Promise<void> { ls()?.clear(); },
};

export default AsyncStorage;
