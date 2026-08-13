import { describe, it, expect, vi, afterEach } from 'vitest';
import { microsoftEngine } from './microsoft';
import { TranslationProviderError } from '~/core/providers/types';

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function msBody(...texts: string[]): unknown {
  return texts.map((text) => ({ translations: [{ text }] }));
}

afterEach(() => vi.unstubAllGlobals());

describe('microsoftEngine', () => {
  it('posts a bare string array and reads the Azure envelope back in order', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(msBody('你好', '世界')));
    vi.stubGlobal('fetch', fetchMock);

    const out = await microsoftEngine.translate({ texts: ['hello', 'world'], targetLang: 'zh-CN' });

    expect(out).toEqual(['你好', '世界']);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      'https://edge.microsoft.com/translate/translatetext?from=&to=zh-Hans&isEnterpriseClient=false',
    );
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body)).toEqual(['hello', 'world']);
  });

  it('escapes angle brackets on the way out and decodes entities on the way back', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(msBody('a &lt; b &amp; c')));
    vi.stubGlobal('fetch', fetchMock);

    const out = await microsoftEngine.translate({ texts: ['a < b & c'], targetLang: 'de' });

    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual(['a &lt; b &amp; c']);
    expect(out).toEqual(['a < b & c']);
  });

  it('sends an explicit source language when one is given', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(msBody('bonjour')));
    vi.stubGlobal('fetch', fetchMock);

    await microsoftEngine.translate({ texts: ['hello'], targetLang: 'fr', sourceLang: 'en' });

    expect(fetchMock.mock.calls[0]![0]).toContain('?from=en&to=fr');
  });

  it('returns early without a request for an empty batch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    expect(await microsoftEngine.translate({ texts: [], targetLang: 'zh-CN' })).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls back to the source text for an entry the service left empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse([{ translations: [{ text: '你好' }] }, { translations: [] }]),
    ));

    expect(await microsoftEngine.translate({ texts: ['hello', 'world'], targetLang: 'zh-CN' }))
      .toEqual(['你好', 'world']);
  });

  it('rejects a response whose length does not line up with the request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(msBody('你好'))));

    await expect(microsoftEngine.translate({ texts: ['hello', 'world'], targetLang: 'zh-CN' }))
      .rejects.toMatchObject({ info: { kind: 'parse', retryable: false } });
  });

  it('maps rate limiting to a retryable error and auth failures to a fatal one', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, 429)));
    await expect(microsoftEngine.translate({ texts: ['x'], targetLang: 'en' }))
      .rejects.toMatchObject({ info: { kind: 'rate-limit', retryable: true, status: 429 } });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, 403)));
    await expect(microsoftEngine.translate({ texts: ['x'], targetLang: 'en' }))
      .rejects.toMatchObject({ info: { kind: 'auth', retryable: false } });
  });

  it('reports an aborted request distinctly from a network failure', async () => {
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort));

    const err = await microsoftEngine.translate({ texts: ['x'], targetLang: 'en' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(TranslationProviderError);
    expect((err as TranslationProviderError).info.kind).toBe('aborted');
  });
});
