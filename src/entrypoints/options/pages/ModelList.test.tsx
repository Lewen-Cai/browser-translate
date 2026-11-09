import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { useState } from 'preact/hooks';
import { AvailableModels, KeptModels } from './ModelList';
import type { ModelSet } from '~/core/providers/models';
import type { Probe } from './useProviderProbe';

afterEach(cleanup);

function Harness({ initial, spy, probe }: { initial: ModelSet; spy?: (s: ModelSet) => void; probe?: Probe }) {
  const [value, setValue] = useState(initial);
  const onChange = (next: ModelSet) => { setValue(next); spy?.(next); };
  return (
    <>
      <KeptModels value={value} onChange={onChange} />
      {probe && <AvailableModels probe={probe} onRefresh={() => {}} value={value} onChange={onChange} />}
    </>
  );
}

const ok = (models: string[]): Probe => ({ state: 'ok', latencyMs: 1, models, credentials: 'x' });

describe('KeptModels', () => {
  it('adds a typed model, making the first one the default', () => {
    const spy = vi.fn();
    render(<Harness initial={{ model: '', models: [] }} spy={spy} />);
    const input = screen.getByPlaceholderText('Model name, e.g. gpt-4o-mini');
    fireEvent.input(input, { target: { value: ' a/b ' } });
    fireEvent.submit(input.closest('form')!);
    expect(spy).toHaveBeenLastCalledWith({ model: 'a/b', models: ['a/b'] });
    expect(screen.getByText('a/b')).toBeTruthy();
  });

  it('removes models, with no default to manage', () => {
    const spy = vi.fn();
    render(<Harness initial={{ model: 'a', models: ['a', 'b'] }} spy={spy} />);
    expect(screen.queryByLabelText(/Set as default/)).toBeNull();
    fireEvent.click(screen.getByLabelText('Remove a'));
    expect(spy).toHaveBeenLastCalledWith({ model: 'b', models: ['b'] });
  });
});

describe('AvailableModels', () => {
  it('lists what the endpoint offers, filters it, and toggles a model in and out', () => {
    const spy = vi.fn();
    render(
      <Harness initial={{ model: 'b/other', models: ['b/other'] }} spy={spy}
        probe={ok(['a/model', 'b/other', 'z/model'])} />,
    );
    expect(screen.getByText('3 models')).toBeTruthy();
    fireEvent.input(screen.getByPlaceholderText('Search models'), { target: { value: 'a/' } });
    expect(screen.getByText('1 models')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /a\/model/ }));
    expect(spy).toHaveBeenLastCalledWith({ model: 'b/other', models: ['b/other', 'a/model'] });
    fireEvent.click(screen.getByRole('button', { name: /a\/model/, pressed: true }));
    expect(spy).toHaveBeenLastCalledWith({ model: 'b/other', models: ['b/other'] });
  });

  it('asks for a connection before there is one, and shows a failure', () => {
    const { rerender } = render(<Harness initial={{ model: '', models: [] }} probe={{ state: 'idle' }} />);
    expect(screen.getByText(/Fill in the connection above/)).toBeTruthy();
    rerender(
      <Harness initial={{ model: '', models: [] }}
        probe={{ state: 'error', message: 'Invalid key', status: 401, credentials: 'x' }} />,
    );
    expect(screen.getByText('HTTP 401 · Invalid key')).toBeTruthy();
  });
});
