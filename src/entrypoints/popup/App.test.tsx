import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/preact';
import { App } from './App';
import { useAppStore } from '~/storage/store';
import { createDefaultAppData } from '~/storage/defaults';

const query = vi.fn();
const send = vi.fn();
beforeEach(() => {
  const data = createDefaultAppData();
  data.settings.uiLanguage = 'en';
  data.settings.theme = 'light';
  useAppStore.setState({ data, loaded: true, load: async () => {} });
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal('chrome', { runtime: { getManifest: () => ({ version: 'test' }), openOptionsPage: vi.fn() }, tabs: { query, sendMessage: send } });
  query.mockReset().mockResolvedValue([{ id: 1, url: 'https://example.org' }]);
  send.mockReset().mockResolvedValue({ translated: false });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('popup current-page control', () => {
  it('keeps trigger mode out of the popup and toggles the current page through its status row', async () => {
    render(<App />);
    const toggle = screen.getByRole('switch', { name: 'Bilingual translation' }) as HTMLButtonElement;
    await waitFor(() => expect(toggle.disabled).toBe(false));
    expect(screen.queryByText('Trigger mode')).toBeNull();
    expect(screen.queryByText('vtest')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Translate page' })).toBeNull();
    send.mockResolvedValueOnce({ translated: true });
    fireEvent.click(toggle);
    await waitFor(() => expect(toggle.getAttribute('aria-checked')).toBe('true'));
    expect(send).toHaveBeenLastCalledWith(1, { type: 'page:toggle' });
  });
  it('disables translation on restricted browser pages', async () => {
    query.mockResolvedValueOnce([{ id: 1, url: 'chrome://extensions' }]);
    render(<App />);
    await screen.findByText('Translation is not available on this browser page.');
    expect((screen.getByRole('switch') as HTMLButtonElement).disabled).toBe(true);
    expect(send).not.toHaveBeenCalled();
  });
  it('offers a refresh hint when the content script is unavailable', async () => {
    send.mockRejectedValueOnce(new Error('no receiver'));
    render(<App />);
    await screen.findByText(/Refresh this webpage/);
    expect((screen.getByRole('switch') as HTMLButtonElement).disabled).toBe(true);
  });
});
