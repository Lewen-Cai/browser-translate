import { createDefaultAppData } from './defaults';
import { migrateAppData } from './migrations';
import type { AppData, CacheEntry, CacheMeta, GlobalSettings } from './schema';

const KEY_APP = 'app:data';
const KEY_CACHE_INDEX = 'cache:index';
const CACHE_PREFIX = 'cache:';

export class StorageClient {
  private get local() {
    return chrome.storage.local;
  }

  async loadAppData(): Promise<AppData> {
    const result = await this.local.get(KEY_APP);
    const existing = result[KEY_APP] as AppData | undefined;
    if (!existing) {
      const fresh = createDefaultAppData();
      await this.saveAppData(fresh);
      return fresh;
    }
    const migrated = migrateAppData(existing);
    if (migrated !== existing) await this.saveAppData(migrated);
    return migrated;
  }

  async saveAppData(data: AppData): Promise<void> {
    await this.local.set({ [KEY_APP]: data });
  }

  /**
   * Merge a settings patch into stored data. Re-reads first, so a write from a
   * content script (which holds no store) can't clobber a setting changed in
   * the popup since that script last loaded.
   */
  async patchSettings(patch: Partial<GlobalSettings>): Promise<void> {
    const data = await this.loadAppData();
    await this.saveAppData({ ...data, settings: { ...data.settings, ...patch } });
  }

  async loadCacheIndex(): Promise<CacheMeta[]> {
    const result = await this.local.get(KEY_CACHE_INDEX);
    return (result[KEY_CACHE_INDEX] as CacheMeta[] | undefined) ?? [];
  }

  async saveCacheIndex(index: CacheMeta[]): Promise<void> {
    await this.local.set({ [KEY_CACHE_INDEX]: index });
  }

  async getCacheEntry(key: string): Promise<CacheEntry | undefined> {
    const storageKey = CACHE_PREFIX + key;
    const result = await this.local.get(storageKey);
    return result[storageKey] as CacheEntry | undefined;
  }

  async setCacheEntry(key: string, entry: CacheEntry): Promise<void> {
    await this.local.set({ [CACHE_PREFIX + key]: entry });
  }

  async deleteCacheEntry(key: string): Promise<void> {
    await this.local.remove(CACHE_PREFIX + key);
  }

  async clearAllCache(): Promise<void> {
    const all = await this.local.get(null);
    const toRemove = Object.keys(all).filter((k) => k.startsWith(CACHE_PREFIX));
    if (toRemove.length > 0) await this.local.remove(toRemove);
    await this.local.remove(KEY_CACHE_INDEX);
  }
}
