import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { useAppStore } from '~/storage/store';
import { createDefaultAppData } from '~/storage/defaults';

vi.mock('~/storage/client', () => ({ StorageClient: class {
  async loadUpdateState() { return { latestTag: null }; }
} }));
vi.mock('~/messaging/client', () => ({ checkForUpdate: vi.fn(async () => ({
  type: 'update:result', updateAvailable: false, latestTag: 'v0.2.1',
})) }));
import { checkForUpdate } from '~/messaging/client';
import { UpdateCheck } from './UpdateCheck';

beforeEach(() => {
  vi.clearAllMocks();
  const data = createDefaultAppData();
  data.settings.uiLanguage = 'en';
  useAppStore.setState({ data });
  vi.stubGlobal('chrome', { runtime: { getManifest: () => ({ version: '0.2.2' }) } });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('settings version', () => {
  it('reads the manifest version without a separate monospace style', () => {
    render(<UpdateCheck />);
    const version = screen.getByText('v0.2.2');
    expect(version.className).not.toContain('font-mono');
    expect(version.className).not.toContain('tracking-');
    expect(checkForUpdate).not.toHaveBeenCalled();
  });
  it('keeps update checking manual in the settings header', async () => {
    render(<UpdateCheck />);
    fireEvent.click(screen.getByRole('button', { name: 'Check for updates' }));
    await waitFor(() => expect(checkForUpdate).toHaveBeenCalledTimes(1));
    await screen.findByText('This is the newest release.');
  });
});
