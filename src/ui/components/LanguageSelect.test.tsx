import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { LanguageSelect } from './LanguageSelect';
import { useAppStore } from '~/storage/store';
import { createDefaultAppData } from '~/storage/defaults';

beforeEach(() => {
  const data = createDefaultAppData();
  data.settings.uiLanguage = 'en';
  useAppStore.setState({ data });
});
afterEach(cleanup);

function open() {
  const onChange = vi.fn();
  render(<LanguageSelect value="en-US" onChange={onChange} />);
  const button = screen.getByRole('button', { name: 'Target language English (United States)' });
  fireEvent.click(button);
  return { onChange, button, input: screen.getByRole('combobox') };
}

describe('LanguageSelect', () => {
  it('opens a searchable themed list with selection semantics', () => {
    const { input, button } = open();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(input);
    expect(screen.getAllByRole('option')).toHaveLength(56);
    expect(screen.getByRole('option', { selected: true }).textContent).toContain('English');
  });

  it('filters, selects an English region and restores focus', () => {
    const { onChange, input, button } = open();
    fireEvent.input(input, { target: { value: 'Australian' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('en-AU');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it('supports keyboard navigation without changing the selected value until Enter', () => {
    const { onChange, input } = open();
    fireEvent.input(input, { target: { value: 'English' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(onChange).not.toHaveBeenCalled();
    expect(input.getAttribute('aria-activedescendant')).toContain('en-GB');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('en-GB');
  });

  it('Escape closes without saving and Tab is not trapped', () => {
    const { onChange, input, button } = open();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).toBeNull();
    fireEvent.keyDown(button, { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Tab' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('shows an empty result, ignores Enter and closes on outside press', () => {
    const { input, onChange } = open();
    fireEvent.input(input, { target: { value: 'xxxxzzzz' } });
    expect(screen.getByText('No matches')).not.toBeNull();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('isolates RTL text without setting block direction', () => {
    const { input } = open();
    fireEvent.input(input, { target: { value: 'Arabic' } });
    const option = screen.getByRole('option');
    expect(option.querySelector('bdi[lang="ar"]')?.textContent).toBe('العربية');
    expect(option.querySelector('span[dir]')).toBeNull();
  });

  it('does not select during IME composition', () => {
    const { input, onChange } = open();
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(onChange).not.toHaveBeenCalled();
  });
});
