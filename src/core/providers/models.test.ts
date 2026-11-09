import { describe, expect, it } from 'vitest';
import { addModel, effectiveModel, normalizeModelSet, removeModel, setDefaultModel } from './models';

describe('normalizeModelSet', () => {
  it('returns null for a sound pair', () => {
    expect(normalizeModelSet('a', ['a', 'b'])).toBeNull();
    expect(normalizeModelSet('', [])).toBeNull();
  });

  it('turns a pre-list single model into a one-item list', () => {
    expect(normalizeModelSet('gpt-4o', undefined)).toEqual({ model: 'gpt-4o', models: ['gpt-4o'] });
  });

  it('puts a default that is missing from the list at the front', () => {
    expect(normalizeModelSet('c', ['a', 'b'])).toEqual({ model: 'c', models: ['c', 'a', 'b'] });
  });

  it('picks the first model when there is no default', () => {
    expect(normalizeModelSet('', ['a', 'b'])).toEqual({ model: 'a', models: ['a', 'b'] });
  });

  it('trims, drops empties and duplicates, and ignores non-strings', () => {
    expect(normalizeModelSet(' a ', ['a', ' ', 'b', 'b', 3, null])).toEqual({ model: 'a', models: ['a', 'b'] });
  });

  it('handles garbage', () => {
    expect(normalizeModelSet(undefined, 'x')).toEqual({ model: '', models: [] });
  });
});

describe('model list edits', () => {
  const set = { model: 'a', models: ['a', 'b', 'c'] };

  it('adds to the end and keeps the default', () => {
    expect(addModel(set, ' d ')).toEqual({ model: 'a', models: ['a', 'b', 'c', 'd'] });
  });

  it('makes the first added model the default', () => {
    expect(addModel({ model: '', models: [] }, 'x')).toEqual({ model: 'x', models: ['x'] });
  });

  it('ignores empty and duplicate additions', () => {
    expect(addModel(set, '  ')).toBe(set);
    expect(addModel(set, 'b')).toBe(set);
  });

  it('hands the default to the first model left when it is removed', () => {
    expect(removeModel(set, 'a')).toEqual({ model: 'b', models: ['b', 'c'] });
    expect(removeModel({ model: 'a', models: ['a'] }, 'a')).toEqual({ model: '', models: [] });
  });

  it('keeps the default when another model is removed', () => {
    expect(removeModel(set, 'c')).toEqual({ model: 'a', models: ['a', 'b'] });
  });

  it('sets only a listed model as default', () => {
    expect(setDefaultModel(set, 'c')).toEqual({ model: 'c', models: ['a', 'b', 'c'] });
    expect(setDefaultModel(set, 'z')).toBe(set);
  });
});

describe('effectiveModel', () => {
  const set = { model: 'a', models: ['a', 'b'] };

  it('uses the named model while it is listed', () => {
    expect(effectiveModel(set, 'b')).toBe('b');
  });

  it('falls back to the default when none is named or it was removed', () => {
    expect(effectiveModel(set, undefined)).toBe('a');
    expect(effectiveModel(set, 'gone')).toBe('a');
  });
});
