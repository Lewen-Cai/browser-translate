import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { useState } from 'preact/hooks';
import { ModelList } from './ModelList';
import type { ModelSet } from '~/core/providers/models';

vi.mock('~/messaging/client', () => ({
  pingApi: vi.fn(async () => ({
    type: 'ping:ok', requestId: 'x', latencyMs: 1, modelInList: null, configuredModel: '',
    availableModels: ['z/model', 'a/model', 'a/model', 'b/other'],
  })),
}));

function Harness({ initial, spy }: { initial: ModelSet; spy?: (s: ModelSet) => void }) {
  const [value, setValue] = useState(initial);
  return <ModelList id="openrouter" value={value} onChange={(next) => { setValue(next); spy?.(next); }} />;
}

describe('ModelList', () => {
  it('adds a typed model, making the first one the default', () => {
    const spy = vi.fn();
    render(<Harness initial={{ model: '', models: [] }} spy={spy} />);
    const input = screen.getByPlaceholderText('Model name, e.g. gpt-4o-mini');
    fireEvent.input(input, { target: { value: ' a/b ' } });
    fireEvent.submit(input.closest('form')!);
    expect(spy).toHaveBeenLastCalledWith({ model: 'a/b', models: ['a/b'] });
    expect(screen.getByText('a/b')).toBeTruthy();
  });

  it('sets another model as default and removes models', () => {
    const spy = vi.fn();
    render(<Harness initial={{ model: 'a', models: ['a', 'b'] }} spy={spy} />);
    fireEvent.click(screen.getByLabelText('Set as default'));
    expect(spy).toHaveBeenLastCalledWith({ model: 'b', models: ['a', 'b'] });
    fireEvent.click(screen.getByLabelText('Remove b'));
    expect(spy).toHaveBeenLastCalledWith({ model: 'a', models: ['a'] });
  });

  it('fetches, de-duplicates, sorts, filters and toggles endpoint models', async () => {
    const spy = vi.fn();
    render(<Harness initial={{ model: 'b/other', models: ['b/other'] }} spy={spy} />);
    fireEvent.click(screen.getByText('Fetch list'));
    await waitFor(() => expect(screen.getByText('3 models')).toBeTruthy());
    fireEvent.input(screen.getByPlaceholderText('Search models'), { target: { value: 'a/' } });
    expect(screen.getByText('1 models')).toBeTruthy();
    fireEvent.click(screen.getByText('a/model'));
    expect(spy).toHaveBeenLastCalledWith({ model: 'b/other', models: ['b/other', 'a/model'] });
  });
});
