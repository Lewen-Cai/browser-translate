import { describe, it, expect, vi } from 'vitest';
import {
  LATEST_RELEASE_ENDPOINT,
  RELEASES_PAGE,
  fetchLatestRelease,
  type FetchLike,
} from './github';

function answer(body: unknown, init: { ok?: boolean; status?: number } = {}): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  } as Response;
}

describe('fetchLatestRelease', () => {
  it('asks the endpoint that needs no host permission', () => {
    // It answers Access-Control-Allow-Origin: *, which is the whole reason this
    // feature costs the user no permission prompt.
    expect(LATEST_RELEASE_ENDPOINT).toBe(
      'https://api.github.com/repos/Lewen-Cai/browser-translate/releases/latest',
    );
  });

  it('returns the tag, the page it was published on, and the package', async () => {
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(
      answer({
        tag_name: 'v0.2.1',
        html_url: 'https://github.com/x/y/releases/tag/v0.2.1',
        assets: [{ name: 'browser-translate-0.2.1-chrome.zip', browser_download_url: 'https://x/y.zip' }],
      }),
    );
    await expect(fetchLatestRelease(fetchImpl)).resolves.toEqual({
      tag: 'v0.2.1',
      url: 'https://github.com/x/y/releases/tag/v0.2.1',
      downloadUrl: 'https://x/y.zip',
    });
    expect(fetchImpl).toHaveBeenCalledWith(LATEST_RELEASE_ENDPOINT, expect.anything());
  });

  it('falls back to the releases list when the answer names no page', async () => {
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(answer({ tag_name: '0.2.1' }));
    await expect(fetchLatestRelease(fetchImpl)).resolves.toEqual({
      tag: '0.2.1',
      url: RELEASES_PAGE,
      downloadUrl: null,
    });
  });

  it('picks the package by extension, not by a name carrying the version', async () => {
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(
      answer({
        tag_name: '0.2.1',
        assets: [
          { name: 'notes.txt', browser_download_url: 'https://x/notes.txt' },
          { name: 'anything-at-all.ZIP', browser_download_url: 'https://x/build.zip' },
        ],
      }),
    );
    await expect(fetchLatestRelease(fetchImpl)).resolves.toMatchObject({
      downloadUrl: 'https://x/build.zip',
    });
  });

  it('treats a release with nothing attached as a release, not a failure', async () => {
    // The page is still worth offering; there is just nothing to hand over.
    for (const assets of [undefined, [], 'nonsense', [{ name: 'notes.txt' }]]) {
      const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(answer({ tag_name: '0.2.1', assets }));
      await expect(fetchLatestRelease(fetchImpl)).resolves.toMatchObject({ downloadUrl: null });
    }
  });

  it('names the rate limit, which is what a 403 here almost always is', async () => {
    // Otherwise it reads as a permission problem and sends someone looking for
    // a setting that does not exist.
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(answer({}, { ok: false, status: 403 }));
    await expect(fetchLatestRelease(fetchImpl)).rejects.toThrow(/rate limit/i);
  });

  it('reports any other status as itself', async () => {
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(answer({}, { ok: false, status: 500 }));
    await expect(fetchLatestRelease(fetchImpl)).rejects.toThrow(/500/);
  });

  it('refuses a tag it could not compare, rather than passing it on', async () => {
    for (const tag of [undefined, '', 'nightly', 'v0.2.1-rc1']) {
      const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(answer({ tag_name: tag }));
      await expect(fetchLatestRelease(fetchImpl)).rejects.toThrow(/readable release tag/i);
    }
  });

  it('passes an abort signal through when given one', async () => {
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(answer({ tag_name: '0.2.1' }));
    const controller = new AbortController();
    await fetchLatestRelease(fetchImpl, controller.signal);
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({ signal: controller.signal });
  });
});
