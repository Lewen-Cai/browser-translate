import { describe, expect, it } from 'vitest';
import { addModel, normalizeModelSet, removeModel } from './models';

describe('normalizeModelSet', () => {
  it('returns null for a sound pair, where model is the first on the list', () => {
    expect(normalizeModelSet('a', ['a', 'b'])).toBeNull();
    expect(normalizeModelSet('', [])).toBeNull();
  });

  it('turns a pre-list single model into a one-item list', () => {
    expect(normalizeModelSet('gpt-4o', undefined)).toEqual({ model: 'gpt-4o', models: ['gpt-4o'] });
  });

  it('moves a model marked as default by a development build to the front', () => {
    expect(normalizeModelSet('b', ['a', 'b', 'c'])).toEqual({ model: 'b', models: ['b', 'a', 'c'] });
  });

  it('puts a model missing from the list at the front', () => {
    expect(normalizeModelSet('c', ['a', 'b'])).toEqual({ model: 'c', models: ['c', 'a', 'b'] });
  });

  it('takes the first model when none is named', () => {
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

  it('adds to the end', () => {
    expect(addModel(set, ' d ')).toEqual({ model: 'a', models: ['a', 'b', 'c', 'd'] });
  });

  it('makes the first added model the fallback', () => {
    expect(addModel({ model: '', models: [] }, 'x')).toEqual({ model: 'x', models: ['x'] });
  });

  it('ignores empty and duplicate additions', () => {
    expect(addModel(set, '  ')).toBe(set);
    expect(addModel(set, 'b')).toBe(set);
  });

  it('hands the fallback to the first model left when the first is removed', () => {
    expect(removeModel(set, 'a')).toEqual({ model: 'b', models: ['b', 'c'] });
    expect(removeModel({ model: 'a', models: ['a'] }, 'a')).toEqual({ model: '', models: [] });
  });

  it('keeps the fallback when another model is removed', () => {
    expect(removeModel(set, 'c')).toEqual({ model: 'a', models: ['a', 'b'] });
  });
});
