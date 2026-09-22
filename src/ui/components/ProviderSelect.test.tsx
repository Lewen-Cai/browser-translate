import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { ProviderSelect } from './ProviderSelect';

afterEach(cleanup);
describe('ProviderSelect', () => {
  it('labels the inline trigger and supports keyboard choice and focus return', () => {
    const onChange = vi.fn();
    render(<ProviderSelect inline label="Selection" value="google" onChange={onChange}
      options={[{ value: 'google', label: 'Google', iconId: 'google' }, { value: 'microsoft', label: 'Microsoft', iconId: 'microsoft' }]} />);
    const trigger = screen.getByRole('button', { name: 'Selection Google' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const selected = screen.getByRole('option', { selected: true });
    expect(document.activeElement).toBe(selected);
    fireEvent.keyDown(selected, { key: 'ArrowDown' });
    const microsoft = screen.getByRole('option', { name: 'Microsoft' });
    expect(document.activeElement).toBe(microsoft);
    fireEvent.click(microsoft);
    expect(onChange).toHaveBeenCalledWith('microsoft');
    expect(document.activeElement).toBe(trigger);
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
