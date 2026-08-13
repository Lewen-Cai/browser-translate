import type { AppData, ApiSettings, GlobalSettings, ProviderSlot } from './schema';
import { createDefaultAppData } from './defaults';
import { migrateAppData } from './migrations';

export const EXPORT_FORMAT = 'browsertranslate-settings' as const;
export const EXPORT_VERSION = 1 as const;

export interface ExportFile {
  format: typeof EXPORT_FORMAT;
  version: typeof EXPORT_VERSION;
  exportedAt: number;
  data: {
    api: ApiSettings;
    settings: GlobalSettings;
    // Pre-v0.1.8 exports also carried `promptTemplates` — ignored on import.
  };
}

/** Thrown when an imported file is not a recognizable settings export. */
export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportError';
  }
}

/**
 * Serialize the portable slice of AppData. Keys are stripped unless
 * opts.includeKeys. `exportedAt` is injected by the caller so this stays pure.
 */
export function exportAppData(
  data: AppData,
  opts: { includeKeys: boolean },
  exportedAt: number,
): ExportFile {
  const api: ApiSettings = { ...data.api };
  if (!opts.includeKeys) {
    api.apiKey = '';
    api.customHeaders = undefined;
    if (api.savedConfigs) {
      const stripped: NonNullable<ApiSettings['savedConfigs']> = {};
      for (const [slot, cfg] of Object.entries(api.savedConfigs)) {
        if (cfg) stripped[slot as ProviderSlot] = { ...cfg, apiKey: '' };
      }
      api.savedConfigs = stripped;
    }
  }
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt,
    data: {
      api,
      settings: { ...data.settings },
    },
  };
}

/**
 * Validate a parsed export file and turn it into a full AppData (full replace).
 * Missing fields are filled from defaults; builtins are re-seeded and integrity
 * is repaired via the shared migrateAppData pass.
 */
export function importAppData(parsed: unknown): AppData {
  if (!parsed || typeof parsed !== 'object') {
    throw new ImportError('Not a valid settings file');
  }
  const file = parsed as Partial<ExportFile>;
  if (file.format !== EXPORT_FORMAT) {
    throw new ImportError('Unrecognized file format');
  }
  if (file.version !== EXPORT_VERSION) {
    throw new ImportError(`Unsupported file version: ${String(file.version)}`);
  }
  if (!file.data || typeof file.data !== 'object') {
    throw new ImportError('Settings file has no data');
  }

  const base = createDefaultAppData();
  const candidate: AppData = {
    version: base.version,
    // Legacy exports may smuggle api.promptTemplateId in via this spread;
    // migrateAppData's stripLegacyTemplateFields pass removes it.
    api: { ...base.api, ...(file.data.api ?? {}) },
    settings: { ...base.settings, ...(file.data.settings ?? {}) },
  };

  // Reuse the integrity-repair pass: strips legacy fields, fills provider
  // defaults, seeds savedConfigs.
  try {
    return migrateAppData(candidate);
  } catch (e) {
    throw new ImportError(`Settings file could not be applied: ${String(e)}`);
  }
}
