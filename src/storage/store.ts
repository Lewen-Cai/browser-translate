import { create } from 'zustand';
import type { AppData, GlobalSettings, ProviderConfig } from './schema';
import type { ProviderId } from '~/core/providers/registry';
import { StorageClient } from './client';
import { createDefaultAppData } from './defaults';
import { releaseRoutes } from '~/core/engines/routing';

interface AppStore {
  data: AppData;
  loaded: boolean;

  load: () => Promise<void>;
  /** Patch one provider's row. Every provider has a row, so this never creates one. */
  updateProvider: (id: ProviderId, patch: Partial<ProviderConfig>) => Promise<void>;
  updateSettings: (patch: Partial<GlobalSettings>) => Promise<void>;
  replaceAll: (data: AppData) => Promise<void>;
}

const client = new StorageClient();

/**
 * The popup and the settings page each hold a copy of the data, and either
 * can be open while the other changes it. So every write re-reads storage and
 * patches that rather than this page's copy — otherwise toggling a provider
 * here would write back a routing choice made over there — and writes run one
 * at a time, so two quick edits on one page cannot drop each other either.
 */
let writes: Promise<unknown> = Promise.resolve();
function write(change: (current: AppData) => AppData): Promise<AppData> {
  const next = writes.then(async () => {
    const data = change(await client.loadAppData());
    await client.saveAppData(data);
    return data;
  });
  writes = next.catch(() => {});
  return next;
}

let watching = false;

export const useAppStore = create<AppStore>((set) => ({
  data: createDefaultAppData(),
  loaded: false,

  async load() {
    const data = await client.loadAppData();
    set({ data, loaded: true });
    // Follow changes made on the other page, so this one shows them too.
    if (!watching) {
      watching = true;
      client.watchAppData((next) => set({ data: next }));
    }
  },

  async updateProvider(id, patch) {
    const data = await write((current) => {
      const providers = { ...current.providers, [id]: { ...current.providers[id], ...patch } };
      // A mode whose provider was just switched off, or whose model was just
      // removed, loses its engine rather than keeping it for later.
      const engines = releaseRoutes(current.settings.engines, providers, id);
      return {
        ...current,
        providers,
        ...(engines !== current.settings.engines && { settings: { ...current.settings, engines } }),
      };
    });
    set({ data });
  },

  async updateSettings(patch) {
    const data = await write((current) => ({ ...current, settings: { ...current.settings, ...patch } }));
    set({ data });
  },

  async replaceAll(data) {
    await write(() => data);
    set({ data });
  },
}));
