import { describe, it, expect, beforeEach } from 'vitest';
import { StorageClient } from './client';

interface FakeStorage {
  data: Record<string, unknown>;
  get(keys: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
  clear(): Promise<void>;
}

function fakeStorage(): FakeStorage {
  return {
    data: {},
    async get(keys) {
      if (keys === null) return { ...this.data };
      const arr = typeof keys === 'string' ? [keys] : keys;
      const out: Record<string, unknown> = {};
      for (const k of arr) if (k in this.data) out[k] = this.data[k];
      return out;
    },
    async set(items) { Object.assign(this.data, items); },
    async remove(keys) {
      const arr = typeof keys === 'string' ? [keys] : keys;
      for (const k of arr) delete this.data[k];
    },
    async clear() { this.data = {}; },
  };
}

describe('StorageClient', () => {
  let fake: FakeStorage;
  let client: StorageClient;

  beforeEach(() => {
    fake = fakeStorage();
    // @ts-expect-error stubbing chrome global
    globalThis.chrome = { storage: { local: fake } };
    client = new StorageClient();
  });

  it('initializes with default AppData when empty', async () => {
    const data = await client.loadAppData();
    expect(data.version).toBe(1);
    expect(data.api.baseUrl).toBe('');
    expect(data.api.apiKey).toBe('');
    expect(data.api.model).toBe('');
  });

  it('persists writes', async () => {
    const data = await client.loadAppData();
    data.settings.targetLanguage = 'en';
    data.api.model = 'gpt-4o-mini';
    await client.saveAppData(data);
    const reloaded = await client.loadAppData();
    expect(reloaded.settings.targetLanguage).toBe('en');
    expect(reloaded.api.model).toBe('gpt-4o-mini');
  });

  it('cache entries are stored independently', async () => {
    await client.setCacheEntry('abc', { translated: 'hello' });
    const entry = await client.getCacheEntry('abc');
    expect(entry?.translated).toBe('hello');
  });

  it('returns undefined for missing cache entry', async () => {
    expect(await client.getCacheEntry('nope')).toBeUndefined();
  });

  it('deletes cache entry', async () => {
    await client.setCacheEntry('x', { translated: 'a' });
    await client.deleteCacheEntry('x');
    expect(await client.getCacheEntry('x')).toBeUndefined();
  });

  it('clears all cache', async () => {
    await client.setCacheEntry('a', { translated: '1' });
    await client.setCacheEntry('b', { translated: '2' });
    await client.clearAllCache();
    expect(await client.getCacheEntry('a')).toBeUndefined();
    expect(await client.getCacheEntry('b')).toBeUndefined();
  });

  describe('patchSettings', () => {
    it('merges a patch into stored settings, leaving the rest alone', async () => {
      await client.loadAppData();
      await client.patchSettings({ subtitleOffsetPct: 0.42 });

      const reloaded = await client.loadAppData();
      expect(reloaded.settings.subtitleOffsetPct).toBe(0.42);
      expect(reloaded.settings.targetLanguage).toBe('zh-CN');
    });

    it('re-reads before merging, so it cannot clobber a concurrent change', async () => {
      const initial = await client.loadAppData();

      // Another surface (the popup) writes while this caller still holds the
      // older snapshot — content scripts have no store to keep them in sync.
      await client.saveAppData({
        ...initial,
        settings: { ...initial.settings, targetLanguage: 'ja' },
      });
      await client.patchSettings({ subtitleOffsetPct: 0.3 });

      const reloaded = await client.loadAppData();
      expect(reloaded.settings.targetLanguage).toBe('ja');
      expect(reloaded.settings.subtitleOffsetPct).toBe(0.3);
    });
  });
});
