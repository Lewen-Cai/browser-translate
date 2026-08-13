import { googleEngine } from './google';
import { microsoftEngine } from './microsoft';
import type { MtEngine, MtEngineId } from './types';

export const MT_ENGINES: Record<MtEngineId, MtEngine> = {
  microsoft: microsoftEngine,
  google: googleEngine,
};

export function getMtEngine(id: MtEngineId): MtEngine {
  return MT_ENGINES[id];
}

export { mtTranslateAll } from './run';
export { MT_ENGINE_IDS, isMtEngineId } from './types';
export type { MtEngine, MtEngineId, MtRequest } from './types';
