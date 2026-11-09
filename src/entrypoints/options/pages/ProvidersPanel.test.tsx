import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { ProvidersPanel } from './ProvidersPanel';
import { useAppStore } from '~/storage/store';
import { createDefaultAppData } from '~/storage/defaults';

vi.mock('~/messaging/client', () => ({ pingApi: vi.fn(() => new Promise(() => {})) }));

beforeEach(() => {
  const data = createDefaultAppData();
  data.settings.uiLanguage = 'en';
  useAppStore.setState({ data });
});
afterEach(cleanup);

describe('ProvidersPanel', () => {
  it('groups providers by what they ask of the user', () => {
    const { container } = render(<ProvidersPanel />);
    const order = Array.from(container.querySelectorAll('li')).map((li) => li.textContent ?? '');
    const at = (text: string) => order.findIndex((t) => t.includes(text));
    expect(at('Free translation services')).toBeLessThan(at('Microsoft Translator'));
    expect(at('Google Translate')).toBeLessThan(at('Cloud APIs'));
    expect(at('Cloud APIs')).toBeLessThan(at('OpenRouter'));
    expect(at('OpenRouter')).toBeLessThan(at('Local & custom'));
  });

  it('shows the free-service statement only when asked', () => {
    render(<ProvidersPanel />);
    expect(screen.queryByText(/not official APIs/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /About free translation services/ }));
    expect(screen.getByText(/not official APIs/)).toBeTruthy();
  });

  it('filters within groups, drops empty ones, and clears with its own button', () => {
    render(<ProvidersPanel />);
    fireEvent.input(screen.getByPlaceholderText('Search providers…'), { target: { value: 'deep' } });
    expect(screen.queryByText('Free translation services')).toBeNull();
    expect(screen.getAllByText('DeepSeek').length).toBeGreaterThan(0);
    expect(screen.queryByText('OpenAI')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByText('Free translation services')).toBeTruthy();
  });
});
