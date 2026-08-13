import { describe, it, expect, vi, afterEach } from 'vitest';
import { googleEngine } from './google';

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe('googleEngine', () => {
  it('posts the positional body the endpoint expects and reads the nested result', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([['你好', '世界']]));
    vi.stubGlobal('fetch', fetchMock);

    const out = await googleEngine.translate({ texts: ['hello', 'world'], targetLang: 'zh-CN' });

    expect(out).toEqual(['你好', '世界']);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://translate-pa.googleapis.com/v1/translateHtml');
    expect(init.headers['Content-Type']).toBe('application/json+protobuf');
    expect(init.headers['X-Goog-API-Key']).toBeTruthy();
    expect(JSON.parse(init.body)).toEqual([[['hello', 'world'], 'auto', 'zh-CN'], 'wt_lib']);
  });

  it('keeps the region form for traditional Chinese', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([['你好']]));
    vi.stubGlobal('fetch', fetchMock);

    await googleEngine.translate({ texts: ['hello'], targetLang: 'zh-TW', sourceLang: 'en' });

    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)[0]).toEqual([['hello'], 'en', 'zh-TW']);
  });

  it('escapes on the way out and decodes entities on the way back', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([['it&#39;s &lt;b&gt;']]));
    vi.stubGlobal('fetch', fetchMock);

    const out = await googleEngine.translate({ texts: ['it is <b>'], targetLang: 'en' });

    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)[0][0]).toEqual(['it is &lt;b&gt;']);
    expect(out).toEqual(["it's <b>"]);
  });

  it('returns early without a request for an empty batch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    expect(await googleEngine.translate({ texts: [], targetLang: 'en' })).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a truncated or mis-shaped result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([['only one']])));
    await expect(googleEngine.translate({ texts: ['a', 'b'], targetLang: 'en' }))
      .rejects.toMatchObject({ info: { kind: 'parse' } });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ nope: true })));
    await expect(googleEngine.translate({ texts: ['a'], targetLang: 'en' }))
      .rejects.toMatchObject({ info: { kind: 'parse' } });
  });

  it('maps server failures to a retryable error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, 503)));
    await expect(googleEngine.translate({ texts: ['x'], targetLang: 'en' }))
      .rejects.toMatchObject({ info: { kind: 'server', retryable: true, status: 503 } });
  });
});
