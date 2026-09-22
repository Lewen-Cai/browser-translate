import { describe, it, expect } from 'vitest';
import { parseBatchArray } from './parse';

const encode = (rows: unknown[]) => JSON.stringify(rows);
describe('parseBatchArray', () => {
  it('parses and reorders translations by input id, not response position', () => {
    expect(parseBatchArray(encode([{ id: 1, translation: 'b' }, { id: 0, translation: 'a' }]), 2)).toEqual(['a', 'b']);
  });
  it('accepts fences/preamble without returning them', () => {
    expect(parseBatchArray('Sure:\n```json\n' + encode([{ id: 0, translation: 'x' }]) + '\n```', 1)).toEqual(['x']);
  });
  it.each([
    [{ id: 0, translation: 'a' }, { id: 0, translation: 'b' }],
    [{ id: 0, translation: 'a' }],
    [{ id: 0, translation: 'a' }, { id: 2, translation: 'b' }],
    [{ id: '0', translation: 'a' }, { id: 1, translation: 'b' }],
    [{ id: 0, translation: {} }, { id: 1, translation: 'b' }],
    [{ id: 0, translation: 3 }, { id: 1, translation: 'b' }],
    [{ id: -1, translation: 'a' }, { id: 1, translation: 'b' }],
    [{ id: 0.5, translation: 'a' }, { id: 1, translation: 'b' }],
    ['a', 'b'],
  ])('rejects duplicate/missing/invalid ids and non-string content: %j', (...rows) => {
    expect(parseBatchArray(encode(rows), 2)).toBeNull();
  });
  it('rejects unparseable output and wrong root types', () => {
    expect(parseBatchArray('not json', 1)).toBeNull();
    expect(parseBatchArray('{"id":0,"translation":"x"}', 1)).toBeNull();
  });
  it('does not confuse brackets inside the translated content with alignment metadata', () => {
    expect(parseBatchArray(encode([{ id: 0, translation: 'An [example] and "quotes".' }]), 1)).toEqual(['An [example] and "quotes".']);
  });
});
