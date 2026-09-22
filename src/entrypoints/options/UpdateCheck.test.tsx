import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { useAppStore } from '~/storage/store';
import { createDefaultAppData } from '~/storage/defaults';

vi.mock('~/storage/client', () => ({ StorageClient: class {
  async loadUpdateState() { return { latestTag: null, releaseUrl: null, downloadUrl: null }; }
} }));
vi.mock('~/messaging/client', () => ({ checkForUpdate: vi.fn(async () => ({
  type: 'update:result', updateAvailable: false, latestTag: 'v0.2.1',
  releaseUrl: 'https://example.test/releases/tag/v0.2.1', downloadUrl: null,
})) }));
import { checkForUpdate } from '~/messaging/client';
import { UpdateCheck, UpdateNotice, useUpdateCheck } from './UpdateCheck';

beforeEach(() => {
  vi.clearAllMocks();
  const data = createDefaultAppData();
  data.settings.uiLanguage = 'en';
  useAppStore.setState({ data });
  vi.stubGlobal('chrome', { runtime: { getManifest: () => ({ version: '0.2.2' }) } });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const available = {
  kind: 'available' as const,
  tag: 'v0.2.3',
  url: 'https://example.test/releases/tag/v0.2.3',
  downloadUrl: 'https://example.test/download/v0.2.3.zip',
};

/** App's wiring, so the two halves are exercised as they ship. */
function Settings() {
  const { version, checking, outcome, check } = useUpdateCheck();
  return (
    <>
      <UpdateCheck version={version} checking={checking} onCheck={() => void check()} />
      <UpdateNotice outcome={outcome} />
    </>
  );
}

describe('settings version', () => {
  it('reads the manifest version without a separate monospace style', () => {
    render(<UpdateCheck version="0.2.2" checking={false} onCheck={() => {}} />);
    const version = screen.getByText('v0.2.2');
    expect(version.className).not.toContain('font-mono');
    expect(version.className).not.toContain('tracking-');
    expect(checkForUpdate).not.toHaveBeenCalled();
  });

  it('keeps update checking manual in the settings header', async () => {
    render(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: 'Check for updates' }));
    await waitFor(() => expect(checkForUpdate).toHaveBeenCalledTimes(1));
    await screen.findByText('This is the newest release.');
  });
});

describe('the header holds nothing that grows', () => {
  // The regression this split exists to prevent: the result used to render
  // inside the header, so the header's height was whatever the check found —
  // 93px when idle, 261px with a release notice in it — and everything below
  // moved the moment the button was pressed.
  it('renders the version and the button, and none of the notice', () => {
    render(<UpdateCheck version="0.2.2" checking={false} onCheck={() => {}} />);
    expect(screen.queryByText(/has been released/)).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByText(/Chrome cannot install this/)).toBeNull();
  });

  it('leaves the notice empty until a check produces one', () => {
    const { container } = render(<UpdateNotice outcome={null} />);
    expect(container.textContent).toBe('');
  });
});

describe('the notice carries the result', () => {
  it('offers the package, the release page, and what to do with the file', () => {
    render(<UpdateNotice outcome={available} />);
    expect(screen.getByRole('status').textContent).toContain('v0.2.3 has been released.');
    expect(screen.getByRole('link', { name: /Download/ }).getAttribute('href')).toBe(available.downloadUrl);
    expect(screen.getByRole('link', { name: /Download/ }).hasAttribute('download')).toBe(true);
    expect(screen.getByRole('link', { name: 'Open the release page' }).getAttribute('href')).toBe(available.url);
    expect(screen.getByText(/Chrome cannot install this for you/)).toBeTruthy();
  });

  it('still offers the page when a release has nothing attached', () => {
    render(<UpdateNotice outcome={{ ...available, downloadUrl: null }} />);
    expect(screen.queryByRole('link', { name: /Download/ })).toBeNull();
    expect(screen.getByRole('link', { name: 'Open the release page' })).toBeTruthy();
  });

  it('reports the two outcomes that need no action', () => {
    const { container: current } = render(<UpdateNotice outcome={{ kind: 'current' }} />);
    expect(current.textContent).toContain('This is the newest release.');
    cleanup();
    const { container: failed } = render(<UpdateNotice outcome={{ kind: 'error', message: 'HTTP 503' }} />);
    expect(failed.textContent).toContain('Could not check:');
    expect(failed.textContent).toContain('HTTP 503');
  });
});

describe('a stored result', () => {
  it('appears on its own when a previous check found a newer release', async () => {
    const { StorageClient } = await import('~/storage/client');
    vi.spyOn(StorageClient.prototype, 'loadUpdateState').mockResolvedValue({
      lastCheckedAt: 1, latestTag: 'v0.2.3',
      releaseUrl: available.url, downloadUrl: available.downloadUrl,
    });
    render(<Settings />);
    await screen.findByText('v0.2.3 has been released.');
    expect(checkForUpdate).not.toHaveBeenCalled();
  });

  it('stays quiet when the stored tag is not newer than the running build', async () => {
    const { StorageClient } = await import('~/storage/client');
    vi.spyOn(StorageClient.prototype, 'loadUpdateState').mockResolvedValue({
      lastCheckedAt: 1, latestTag: 'v0.2.2', releaseUrl: available.url, downloadUrl: available.downloadUrl,
    });
    const { container } = render(<Settings />);
    await waitFor(() => expect(container.querySelector('[role="status"]')).toBeNull());
  });
});
