import { useEffect, useRef, useState } from 'preact/hooks';
import { pingApi } from '~/messaging/client';
import { PROVIDERS, type ProviderId } from '~/core/providers/registry';
import type { PingResponse } from '~/messaging/types';
import type { ProviderConfig } from '~/storage/schema';

export type Probe =
  /** Nothing to ask yet: no address, or a key-needing provider with no key. */
  | { state: 'idle' }
  | { state: 'pending' }
  | { state: 'ok'; latencyMs: number; models: string[]; credentials: string }
  | { state: 'error'; message: string; status?: number; credentials: string };

/** What a probe result is evidence about: the address and the key, nothing else. */
export function credentialsOf(cfg: ProviderConfig): string {
  return `${cfg.baseUrl}\n${cfg.apiKey}`;
}

/** Wait this long after the last keystroke before asking. */
const SETTLE_MS = 1200;

/**
 * Ask the provider's endpoint for its model list whenever the address or key
 * settles, and once on open.
 *
 * One request answers two questions — does the connection work, and which
 * models are there — so the status in the header and the list in the Models
 * card both read this rather than each asking on their own. The result carries
 * the credentials it was made with, so a caller can tell a stale "ok" (the key
 * has since been edited) from a current one.
 */
export function useProviderProbe(id: ProviderId, cfg: ProviderConfig) {
  const [probe, setProbe] = useState<Probe>({ state: 'idle' });
  const [nonce, setNonce] = useState(0);
  const seq = useRef(0);
  const credentials = credentialsOf(cfg);
  const askable = Boolean(cfg.baseUrl) && (!PROVIDERS[id].needsKey || Boolean(cfg.apiKey));
  const first = useRef(true);

  useEffect(() => {
    if (!askable) {
      seq.current++;
      setProbe({ state: 'idle' });
      return;
    }
    const mine = ++seq.current;
    setProbe({ state: 'pending' });
    // Opening the page, or pressing refresh, asks at once; typing waits.
    const delay = first.current || nonce > 0 ? 0 : SETTLE_MS;
    first.current = false;
    const timer = setTimeout(() => {
      void pingApi(id).then((r: PingResponse) => {
        if (mine !== seq.current) return;
        setProbe(
          r.type === 'ping:ok'
            ? { state: 'ok', latencyMs: r.latencyMs, models: [...new Set(r.availableModels)].sort((a, b) => a.localeCompare(b)), credentials }
            : { state: 'error', message: r.message, status: r.status, credentials },
        );
      });
    }, delay);
    return () => clearTimeout(timer);
    // `credentials` covers baseUrl and apiKey; the model plays no part in
    // whether the connection works or what it lists.
  }, [id, credentials, askable, nonce]);

  return { probe, refresh: () => setNonce((n) => n + 1) };
}
