import { create } from 'zustand';
import type { AppData, GlobalSettings, ProviderConfig } from './schema';
import type { ProviderId } from '~/core/providers/registry';
import { StorageClient } from './client';
import { createDefaultAppData } from './defaults';

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

export const useAppStore = create<AppStore>((set, get) => ({
  data: createDefaultAppData(),
  loaded: false,

  async load() {
    const data = await client.loadAppData();
    set({ data, loaded: true });
  },

  async updateProvider(id, patch) {
    const current = get().data;
    const data = {
      ...current,
      providers: { ...current.providers, [id]: { ...current.providers[id], ...patch } },
    };
    await client.saveAppData(data);
    set({ data });
  },

  async updateSettings(patch) {
    const data = { ...get().data, settings: { ...get().data.settings, ...patch } };
    await client.saveAppData(data);
    set({ data });
  },

  async replaceAll(data) {
    await client.saveAppData(data);
    set({ data });
  },
}));
