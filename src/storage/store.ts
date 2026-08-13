import { create } from 'zustand';
import type { AppData, ApiSettings, GlobalSettings } from './schema';
import { StorageClient } from './client';
import { createDefaultAppData } from './defaults';

interface AppStore {
  data: AppData;
  loaded: boolean;

  load: () => Promise<void>;
  updateApi: (patch: Partial<ApiSettings>) => Promise<void>;
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

  async updateApi(patch) {
    const data = { ...get().data, api: { ...get().data.api, ...patch } };
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
