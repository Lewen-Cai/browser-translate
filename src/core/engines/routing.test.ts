import { describe, it, expect } from 'vitest';
import { DEFAULT_PROVIDER, normalizeEngineRouting, usesModel } from './routing';
import type { EngineRouting } from '~/storage/schema';

const table = (selection = 'microsoft', fullPage = 'microsoft', subtitle = 'microsoft') =>
  ({ selection, fullPage, subtitle }) as EngineRouting;

describe('normalizeEngineRouting', () => {
  it('returns its input reference when already clean', () => {
    const input = table('deepseek', 'google', 'microsoft');
    expect(normalizeEngineRouting(input, 'microsoft')).toBe(input);
  });

  it('seeds every surface from the fallback when there is nothing stored', () => {
    expect(normalizeEngineRouting(undefined, 'anthropic')).toEqual(
      table('anthropic', 'anthropic', 'anthropic'),
    );
    expect(normalizeEngineRouting(null, 'google')).toEqual(table('google', 'google', 'google'));
  });

  it('fills only the surfaces that are missing or invalid', () => {
    const out = normalizeEngineRouting({ selection: 'gemini', fullPage: 'nonsense' }, 'google');
    expect(out).toEqual(table('gemini', 'google', 'google'));
  });

  it('drops keys that are not surfaces', () => {
    const input = { selection: 'opencode', fullPage: 'opencode', subtitle: 'opencode', old: 'x' };
    const out = normalizeEngineRouting(input, 'microsoft');
    expect(out).not.toBe(input);
    expect(Object.keys(out).sort()).toEqual(['fullPage', 'selection', 'subtitle']);
  });

  it('falls back to the default provider when the fallback itself is unusable', () => {
    expect(normalizeEngineRouting(undefined, 'bogus' as never)).toEqual(
      table(DEFAULT_PROVIDER, DEFAULT_PROVIDER, DEFAULT_PROVIDER),
    );
  });

  it('rejects a primitive standing in for the table', () => {
    expect(normalizeEngineRouting('deepseek', 'google')).toEqual(
      table('google', 'google', 'google'),
    );
  });
});

describe('usesModel', () => {
  it('is true when any single surface uses a model', () => {
    expect(usesModel(table('microsoft', 'microsoft', 'anthropic'))).toBe(true);
    expect(usesModel(table('local', 'google', 'google'))).toBe(true);
  });

  it('is false when every surface uses a free service', () => {
    expect(usesModel(table('microsoft', 'google', 'microsoft'))).toBe(false);
  });
});
