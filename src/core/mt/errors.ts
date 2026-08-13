import { TranslationProviderError } from '~/core/providers/types';

/** Map a failed HTTP response to the shared provider-error shape. */
export function httpError(status: number, engine: string): TranslationProviderError {
  const kind = status === 401 || status === 403 ? 'auth'
    : status === 429 ? 'rate-limit'
    : status >= 500 ? 'server'
    : 'unknown';
  return new TranslationProviderError({
    kind,
    message: `${engine}: HTTP ${status}`,
    retryable: kind === 'rate-limit' || kind === 'server',
    status,
  });
}

/** Map a thrown fetch error, keeping aborts distinguishable from real failures. */
export function networkError(e: unknown, engine: string): TranslationProviderError {
  if ((e as Error)?.name === 'AbortError') {
    return new TranslationProviderError({ kind: 'aborted', message: 'Request aborted', retryable: false });
  }
  return new TranslationProviderError({
    kind: 'network',
    message: `${engine}: ${(e as Error)?.message ?? 'network error'}`,
    retryable: true,
  });
}

/** The response parsed but didn't have the shape we translate from. */
export function parseError(engine: string): TranslationProviderError {
  return new TranslationProviderError({
    kind: 'parse',
    message: `${engine}: unexpected response shape`,
    retryable: false,
  });
}
