import { parseVersion } from './version';

/**
 * Asking GitHub what the newest release is.
 *
 * This extension is not distributed through the Chrome Web Store, and Chrome
 * will not update it for us: self-hosted extensions install only under
 * enterprise policy on Windows and macOS, and an unpacked one is never updated
 * at all. `chrome.runtime.requestUpdateCheck` therefore has nothing to say
 * here. Telling someone a release exists is the whole of what we can do; going
 * and getting it stays theirs.
 *
 * The endpoint answers `Access-Control-Allow-Origin: *`, so this needs no host
 * permission — the same reason most model endpoints need none. Unauthenticated
 * callers get sixty requests an hour per address, which a check the user asks
 * for, or one per browser launch, does not come close to.
 */

const REPO = 'Lewen-Cai/browser-translate';

export const LATEST_RELEASE_ENDPOINT = `https://api.github.com/repos/${REPO}/releases/latest`;

/** Where to send someone who wants the release itself. */
export const RELEASES_PAGE = `https://github.com/${REPO}/releases/latest`;

export interface ReleaseInfo {
  /** The tag, with any leading `v` left on — it is shown, not compared. */
  tag: string;
  /** The release page. Falls back to the repository's releases list. */
  url: string;
  /**
   * The built extension attached to that release, if one is.
   *
   * GitHub serves its assets with `Content-Disposition: attachment`, so a plain
   * link to this downloads the file — no `downloads` permission, no tab opened
   * and closed again. A release with nothing attached is not an error: the page
   * is still worth offering, there is just nothing to hand over directly.
   */
  downloadUrl: string | null;
}

/** Anything that answers like `fetch`, so a test does not need the network. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * The newest published release, or a thrown Error naming what went wrong.
 *
 * `/releases/latest` already excludes drafts and pre-releases, so there is no
 * filtering to do — but a tag that is not a readable version is rejected here
 * rather than passed on, because everything downstream would have to keep
 * asking whether it could be trusted.
 */
export async function fetchLatestRelease(
  fetchImpl: FetchLike = fetch,
  signal?: AbortSignal,
): Promise<ReleaseInfo> {
  const response = await fetchImpl(LATEST_RELEASE_ENDPOINT, {
    headers: { Accept: 'application/vnd.github+json' },
    ...(signal && { signal }),
  });

  if (!response.ok) {
    // 403 here is the hourly limit far more often than a permission problem,
    // and saying so is the difference between waiting and going to look for a
    // setting that does not exist.
    throw new Error(
      response.status === 403 || response.status === 429
        ? `GitHub rate limit reached (${response.status})`
        : `GitHub answered ${response.status}`,
    );
  }

  const body = (await response.json()) as {
    tag_name?: unknown;
    html_url?: unknown;
    assets?: unknown;
  };
  const tag = typeof body.tag_name === 'string' ? body.tag_name.trim() : '';
  if (!tag || !parseVersion(tag)) throw new Error('No readable release tag');

  return {
    tag,
    url: typeof body.html_url === 'string' && body.html_url ? body.html_url : RELEASES_PAGE,
    downloadUrl: findPackage(body.assets),
  };
}

/**
 * The packaged extension among a release's attachments.
 *
 * By extension rather than by name, because the name carries the version and
 * would have to be kept in step with whatever the build happens to be called.
 */
function findPackage(assets: unknown): string | null {
  if (!Array.isArray(assets)) return null;
  for (const asset of assets as Array<{ name?: unknown; browser_download_url?: unknown }>) {
    const name = typeof asset?.name === 'string' ? asset.name : '';
    const url = typeof asset?.browser_download_url === 'string' ? asset.browser_download_url : '';
    if (url && name.toLowerCase().endsWith('.zip')) return url;
  }
  return null;
}
