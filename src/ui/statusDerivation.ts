import { isProviderReady } from '~/core/providers/resolve';
import type { ProviderId } from '~/core/providers/registry';
import type { ProviderConfig } from '~/storage/schema';
import type { PingResponse } from '~/messaging/types';

export type StatusState =
  | { kind: 'not-configured' }
  | { kind: 'checking' }
  | { kind: 'ready'; latencyMs: number }
  | { kind: 'model-missing'; availableModels: string[]; configuredModel: string }
  | { kind: 'offline'; message: string; status?: number };

export type PingValue = PingResponse | 'pending' | null;

/**
 * The free services need no credentials, so they are never 'not-configured' —
 * their probe still runs, because reachability is the thing worth reporting.
 * `isProviderReady` knows which fields each kind of provider requires.
 */
export function deriveStatus(
  id: ProviderId,
  cfg: ProviderConfig | undefined,
  ping: PingValue = null,
): StatusState {
  if (!isProviderReady(id, cfg)) return { kind: 'not-configured' };
  if (ping === null || ping === 'pending') return { kind: 'checking' };
  if (ping.type === 'ping:error') {
    return { kind: 'offline', message: ping.message, status: ping.status };
  }
  if (ping.modelInList === false) {
    return {
      kind: 'model-missing',
      availableModels: ping.availableModels,
      configuredModel: ping.configuredModel,
    };
  }
  return { kind: 'ready', latencyMs: ping.latencyMs };
}
