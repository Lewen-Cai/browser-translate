import type { AppData, GlobalSettings, ProvidersConfig } from './schema';
import type { ProviderId } from '~/core/providers/registry';
import { createDefaultAppData } from './defaults';
import { migrateAppData } from './migrations';

export const EXPORT_FORMAT = 'browsertranslate-settings' as const;
export const EXPORT_VERSION = 1 as const;

export interface ExportFile {
  format: typeof EXPORT_FORMAT;
  version: typeof EXPORT_VERSION;
  exportedAt: number;
  data: {
    providers: ProvidersConfig;
    settings: GlobalSettings;
    // Older exports carried `api` (< v0.2.0) and `promptTemplates` (< v0.1.8).
    // Both still import: `api` is handed to the same migration pass a stored
    // v0.1.9 profile goes through, and templates are ignored.
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
  const providers = {} as ProvidersConfig;
  for (const [id, cfg] of Object.entries(data.providers)) {
    providers[id as ProviderId] = opts.includeKeys ? { ...cfg } : { ...cfg, apiKey: '' };
  }
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt,
    data: {
      providers,
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
  const legacy = file.data as { api?: unknown };
  const fileSettings = (file.data.settings ?? {}) as unknown as Record<string, unknown>;
  const settings: Record<string, unknown> = { ...base.settings, ...fileSettings };
  // A file old enough to name the single pre-v0.2.0 `engine` has no routing
  // table of its own. Leaving the default one in place would shadow it, and the
  // import would silently land on the free default instead of what the file
  // said — the one case where a stored profile and an exported file differ,
  // because only the file gets defaults merged underneath it.
  if ('engine' in fileSettings && !('engines' in fileSettings)) delete settings.engines;

  const candidate = {
    version: base.version,
    // A pre-v0.2.0 file carries `api` instead of `providers`. Passing it
    // through untouched lets the migration below turn it into rows, exactly as
    // it does for a stored profile of that vintage — no second code path.
    ...(legacy.api !== undefined
      ? { api: legacy.api, providers: base.providers }
      : { providers: { ...base.providers, ...(file.data.providers ?? {}) } }),
    settings,
  } as unknown as AppData;

  // Reuse the integrity-repair pass: strips legacy fields, adopts providers,
  // fills settings defaults.
  try {
    return migrateAppData(candidate);
  } catch (e) {
    throw new ImportError(`Settings file could not be applied: ${String(e)}`);
  }
}
