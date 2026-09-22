import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { VideoPage } from './VideoPage';
import { useAppStore } from '~/storage/store';
import { createDefaultAppData } from '~/storage/defaults';
import type { GlobalSettings } from '~/storage/schema';
import { DEFAULT_SUBTITLE_STYLE } from '~/core/subtitles/style';

const update = vi.fn<(patch: Partial<GlobalSettings>) => Promise<void>>();
beforeEach(() => {
  const data = createDefaultAppData();
  data.settings.uiLanguage = 'en';
  data.settings.subtitleStyle = { ...data.settings.subtitleStyle, backgroundOpacity: 83,
    main: { ...data.settings.subtitleStyle.main, fontScale: 113 },
    translation: { ...data.settings.subtitleStyle.translation, fontScale: 87 } };
  update.mockReset().mockImplementation(async (patch) => {
    await Promise.resolve();
    const current = useAppStore.getState().data;
    useAppStore.setState({ data: { ...current, settings: { ...current.settings, ...patch } } });
  });
  useAppStore.setState({ data, updateSettings: update });
});
afterEach(cleanup);

function editNumber(name: string, value: string) {
  const input = screen.getByRole('spinbutton', { name }) as HTMLInputElement;
  act(() => input.focus());
  fireEvent.input(input, { target: { value } });
  return input;
}

describe('subtitle editor', () => {
  it('shows non-preset player values exactly instead of blank selects', () => {
    render(<VideoPage />);
    expect((screen.getByRole('spinbutton', { name: 'Original subtitle · Subtitle size' }) as HTMLInputElement).value).toBe('113');
    expect((screen.getByRole('spinbutton', { name: 'Translated subtitle · Subtitle size' }) as HTMLInputElement).value).toBe('87');
    expect((screen.getByRole('spinbutton', { name: 'Background opacity' }) as HTMLInputElement).value).toBe('83');
  });
  it('previews slider movement without storage writes and commits on release', async () => {
    const { container } = render(<VideoPage />);
    const slider = screen.getByRole('slider', { name: 'Background opacity' });
    fireEvent.input(slider, { target: { value: '64' } });
    expect(container.querySelector<HTMLElement>('.ap-subtitle-preview-plate')!.style.background).toContain('0.64');
    expect(update).not.toHaveBeenCalled();
    fireEvent(slider, new Event('change', { bubbles: true }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(useAppStore.getState().data.settings.subtitleStyle.backgroundOpacity).toBe(64);
  });
  it('previews exact sizes and preserves rapid edits to both lines', async () => {
    const { container } = render(<VideoPage />);
    const original = editNumber('Original subtitle · Subtitle size', '121');
    expect(container.querySelector<HTMLElement>('[data-preview-line="main"]')!.style.fontSize).toBe('21.78px');
    expect(update).not.toHaveBeenCalled();
    act(() => original.blur());
    const translation = editNumber('Translated subtitle · Subtitle size', '96');
    act(() => translation.blur());
    await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
    expect(useAppStore.getState().data.settings.subtitleStyle).toMatchObject({ main: { fontScale: 121 }, translation: { fontScale: 96 } });
  });
  it('clamps out-of-range sizes on commit and restores an empty numeric draft', async () => {
    render(<VideoPage />);
    const input = editNumber('Original subtitle · Subtitle size', '999');
    act(() => input.blur());
    await waitFor(() => expect(useAppStore.getState().data.settings.subtitleStyle.main.fontScale).toBe(200));
    const empty = editNumber('Original subtitle · Subtitle size', '');
    act(() => empty.blur());
    expect(empty.value).toBe('200');
    expect(update).toHaveBeenCalledTimes(1);
  });
  it('supports a small palette and validates custom hex without a native color dialog', async () => {
    const { container } = render(<VideoPage />);
    expect(container.querySelector('input[type="color"]')).toBeNull();
    const hex = screen.getByRole('textbox', { name: 'Original subtitle · Color HEX' }) as HTMLInputElement;
    act(() => hex.focus());
    fireEvent.input(hex, { target: { value: '#ZZZZZZ' } });
    act(() => hex.blur());
    expect(screen.getByRole('alert').textContent).toContain('six-digit');
    expect(update).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Original subtitle · Color' }));
    fireEvent.click(screen.getByRole('button', { name: '#FACC15' }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(useAppStore.getState().data.settings.subtitleStyle.main.color).toBe('#FACC15');
  });
  it('updates visibility and order in the preview and can reset the style', async () => {
    const { container } = render(<VideoPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Above' }));
    expect(container.querySelector('[data-preview-line]')?.getAttribute('data-preview-line')).toBe('translation');
    fireEvent.click(screen.getByRole('button', { name: 'Translation only', exact: true }));
    expect(container.querySelector('[data-preview-line="main"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Reset', exact: true }));
    await waitFor(() => expect(useAppStore.getState().data.settings.subtitleStyle).toEqual(DEFAULT_SUBTITLE_STYLE));
  });
});
