import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { ProviderDetail } from './ProviderDetail';
import { useAppStore } from '~/storage/store';
import { createDefaultAppData } from '~/storage/defaults';
import { pingApi } from '~/messaging/client';
import type { ProviderConfig } from '~/storage/schema';
import type { ProviderId } from '~/core/providers/registry';

vi.mock('~/messaging/client', () => ({ pingApi: vi.fn() }));

const updateProvider = vi.fn(async (id: ProviderId, patch: Partial<ProviderConfig>) => {
  const current = useAppStore.getState().data;
  useAppStore.setState({
    data: { ...current, providers: { ...current.providers, [id]: { ...current.providers[id], ...patch } } },
  });
});

function row(): ProviderConfig {
  return useAppStore.getState().data.providers.openrouter;
}

function seed(patch: Partial<ProviderConfig>) {
  const data = useAppStore.getState().data;
  useAppStore.setState({ data: { ...data, providers: { ...data.providers, openrouter: { ...row(), ...patch } } } });
}

beforeEach(() => {
  const data = createDefaultAppData();
  data.settings.uiLanguage = 'en';
  updateProvider.mockClear();
  useAppStore.setState({ data, updateProvider });
  vi.mocked(pingApi).mockReset().mockImplementation(async () => ({
    type: 'ping:ok', requestId: 'r', latencyMs: 12, modelInList: null, configuredModel: '',
    availableModels: ['anthropic/claude-sonnet-4.5', 'openai/gpt-4o-mini'],
  }));
});
afterEach(cleanup);

describe('ProviderDetail auto-enable', () => {
  it('switches on once the key works and a model is chosen, with no trip back to the list', async () => {
    render(<ProviderDetail id="openrouter" onBack={() => {}} />);
    fireEvent.input(screen.getByLabelText('API Key'), { target: { value: 'sk-or-valid' } });
    await waitFor(() => expect(screen.getByText('Connected')).toBeTruthy(), { timeout: 3000 });
    // The key works, but there is nothing to ask yet.
    expect(row().enabled).toBe(false);

    fireEvent.click(await screen.findByRole('button', { name: /anthropic\/claude-sonnet-4\.5/ }));
    await waitFor(() => expect(row().enabled).toBe(true));
    expect(row().model).toBe('anthropic/claude-sonnet-4.5');
    expect(screen.getByText(/Switched on/)).toBeTruthy();
  });

  it('does not switch on when the key is refused', async () => {
    vi.mocked(pingApi).mockImplementation(async () => ({ type: 'ping:error', requestId: 'r', status: 401, message: 'bad key' }));
    seed({ model: 'm', models: ['m'] });
    render(<ProviderDetail id="openrouter" onBack={() => {}} />);
    fireEvent.input(screen.getByLabelText('API Key'), { target: { value: 'sk-bad' } });
    await waitFor(() => expect(screen.getByText('HTTP 401 · bad key')).toBeTruthy(), { timeout: 3000 });
    expect(row().enabled).toBe(false);
  });

  it('leaves a configured provider alone when its page is merely opened', async () => {
    seed({ apiKey: 'sk', model: 'm', models: ['m'], enabled: false });
    render(<ProviderDetail id="openrouter" onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText('Connected')).toBeTruthy());
    expect(row().enabled).toBe(false);
  });

  it('stays off after the user switches it off, even when a model is then added', async () => {
    seed({ apiKey: 'sk', model: 'm', models: ['m'], enabled: true });
    render(<ProviderDetail id="openrouter" onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText('Connected')).toBeTruthy());
    fireEvent.click(screen.getByRole('switch'));
    await waitFor(() => expect(row().enabled).toBe(false));
    fireEvent.click(await screen.findByRole('button', { name: /openai\/gpt-4o-mini/ }));
    await waitFor(() => expect(row().models).toContain('openai/gpt-4o-mini'));
    // An explicit "off" is not overridden by a later edit's probe.
    await new Promise((r) => setTimeout(r, 50));
    expect(row().enabled).toBe(false);
  });
});

describe('ProviderDetail auto-enable, already-usable providers', () => {
  it('does not switch on a usable provider that was left off, when only its models are edited', async () => {
    seed({ apiKey: 'sk', model: 'm', models: ['m'], enabled: false });
    render(<ProviderDetail id="openrouter" onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText('Connected')).toBeTruthy());
    fireEvent.click(await screen.findByRole('button', { name: /openai\/gpt-4o-mini/ }));
    await waitFor(() => expect(row().models).toContain('openai/gpt-4o-mini'));
    await new Promise((r) => setTimeout(r, 50));
    expect(row().enabled).toBe(false);
  });

  it('does switch it on once a new key is entered and works', async () => {
    seed({ apiKey: 'sk-old', model: 'm', models: ['m'], enabled: false });
    render(<ProviderDetail id="openrouter" onBack={() => {}} />);
    fireEvent.input(screen.getByLabelText('API Key'), { target: { value: 'sk-new' } });
    await waitFor(() => expect(row().enabled).toBe(true), { timeout: 3000 });
  });
});

describe('ProviderDetail with no models left', () => {
  it('switches itself off when the last model is removed, and back on when one is added', async () => {
    seed({ apiKey: 'sk', model: 'm', models: ['m'], enabled: true });
    render(<ProviderDetail id="openrouter" onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText('Connected')).toBeTruthy());
    fireEvent.click(screen.getByLabelText('Remove m'));
    await waitFor(() => expect(row().enabled).toBe(false));
    expect(screen.getByText(/it has no models left/)).toBeTruthy();
    fireEvent.click(await screen.findByRole('button', { name: /openai\/gpt-4o-mini/ }));
    await waitFor(() => expect(row().enabled).toBe(true));
  });
});
