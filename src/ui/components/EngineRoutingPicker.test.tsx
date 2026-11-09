import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/preact';
import { EngineRoutingPicker } from './EngineRoutingPicker';
import { useAppStore } from '~/storage/store';
import { createDefaultAppData, createDefaultProviders } from '~/storage/defaults';
import type { EngineRouting } from '~/storage/schema';

beforeEach(() => {
  const data = createDefaultAppData();
  data.settings.uiLanguage = 'en';
  useAppStore.setState({ data });
});
afterEach(cleanup);

function renderWith(engines: EngineRouting, tweak: (p: ReturnType<typeof createDefaultProviders>) => void) {
  const providers = createDefaultProviders();
  providers.openrouter = { ...providers.openrouter, apiKey: 'k', model: 'a', models: ['a'], enabled: true };
  tweak(providers);
  render(<EngineRoutingPicker engines={engines} providers={providers} onChange={() => {}} />);
}

describe('EngineRoutingPicker when a surface is not configured', () => {
  it('shows a placeholder and the reason for a removed model', () => {
    renderWith({
      selection: { provider: 'openrouter', model: 'gone' },
      fullPage: { provider: 'microsoft' },
      subtitle: { provider: 'microsoft' },
    }, (p) => { p.microsoft.enabled = true; });
    expect(screen.getAllByText('Not configured')).toHaveLength(1);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByText(/“Not configured” means/)).toBeTruthy();
  });

  it('shows a placeholder instead of a switched-off provider, never falling back', () => {
    renderWith({
      selection: { provider: 'openrouter', model: 'a' },
      fullPage: { provider: 'microsoft' },
      subtitle: { provider: 'google' },
    }, (p) => { p.openrouter.enabled = false; p.microsoft.enabled = false; p.google.enabled = false; });
    expect(screen.getAllByText('Not configured')).toHaveLength(3);
    expect(screen.queryByText('Microsoft Translator')).toBeNull();
    // One explanation for all three, not one under each.
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('shows a placeholder for a surface with no engine chosen', () => {
    renderWith({ selection: null, fullPage: null, subtitle: { provider: 'microsoft' } },
      (p) => { p.microsoft.enabled = true; });
    expect(screen.getAllByText('Not configured')).toHaveLength(2);
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('says nothing when every surface is configured', () => {
    renderWith({
      selection: { provider: 'openrouter', model: 'a' },
      fullPage: { provider: 'microsoft' },
      subtitle: { provider: 'microsoft' },
    }, (p) => { p.microsoft.enabled = true; });
    expect(screen.queryAllByRole('status')).toHaveLength(0);
    expect(screen.queryByText('Not configured')).toBeNull();
  });
});
