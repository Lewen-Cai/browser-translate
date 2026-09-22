import { describe, expect, it, vi } from 'vitest';
import { selectionTask } from './route';
import { selectionSystemPrompt } from './prompt';
import { InvalidModelOutputError, responseCachePrompt, runSelection, SelectionStreamGate, validateSelectionResult } from './response';
import { selectionUserPrompt } from '~/core/prompt/style';

const passage = '我在花园日志中记录了 soil moisture，并根据每周的 rainfall 调整灌溉。rosemary 只是其中一种植物，不应该只解释这个词。';
const dictionary = JSON.stringify({ headword: 'rosemary', translation: '迷迭香', senses: ['一种香草。'] });

describe('selection routing', () => {
  it.each(['rosemary', 'machine learning', 'New York', '人工智能', 'e.g.'])('retains model choice for short terms: %s', (source) => {
    expect(selectionTask(source)).toBe('auto');
  });
  it.each([passage, 'This is a whole sentence.', 'A line\nAnother line', 'value = sensor[0]', 'a '.repeat(13), '中'.repeat(121), '没有标点的中文段落'.repeat(5)])('forces whole-text translation: %s', (source) => {
    expect(selectionTask(source)).toBe('translate');
    expect(selectionSystemPrompt(selectionTask(source), 'en-AU', 'My custom base.')).not.toContain('DICTIONARY MODE');
  });
  it('frames the entire source, including quotes/newlines/literal variables, as one input value', () => {
    const text = 'Use "name"\nKeep {{value}} literal.';
    const prompt = selectionUserPrompt(text, 'English (Australia)');
    expect(JSON.parse(prompt.slice(prompt.indexOf('\n\n') + 2))).toEqual({ targetLanguage: 'English (Australia)', text });
  });
});

describe('selection response contract', () => {
  it('accepts a complete entry only for the whole eligible selection', () => {
    expect(validateSelectionResult(dictionary, 'rosemary', 'auto')?.format).toBe('dictionary');
    expect(validateSelectionResult(dictionary, 'thyme', 'auto')).toBeNull();
    expect(validateSelectionResult(dictionary, passage, 'translate')).toBeNull();
  });
  it('tolerates fences and harmless casing/punctuation without rendering the fence', () => {
    const result = validateSelectionResult('```json\n' + dictionary + '\n```', 'Rosemary.', 'auto');
    expect(result?.format).toBe('dictionary');
    expect(result?.full.startsWith('{')).toBe(true);
  });
  it.each(['{"headword":"rosemary",', '{"headword":"rosemary"}', 'Here is the result:\n' + dictionary, 'Here is the result: {"result":"wrapped"}', 'Here is the result: ["wrapped"]', ''])('rejects malformed or incomplete protocol: %s', (raw) => {
    expect(validateSelectionResult(raw, 'rosemary', 'auto')).toBeNull();
  });
  it('distinguishes literal structured source text from model metadata', () => {
    const source = '{"label":"Bonjour"}';
    expect(validateSelectionResult('{"label":"Hello"}', source, 'translate')?.format).toBe('text');
    expect(validateSelectionResult(dictionary, source, 'translate')).toBeNull();
    expect(validateSelectionResult('  Ordinary text\n', passage, 'translate')?.full).toBe('  Ordinary text\n');
  });
  it('uses a distinct namespace from unchecked caches', () => {
    expect(responseCachePrompt('system')).not.toBe('system');
  });
});

describe('stream gate and bounded correction', () => {
  it.each([dictionary, '```json\n' + dictionary + '\n```', '  \n' + dictionary])('buffers structural tokens even when split one character at a time', (raw) => {
    const gate = new SelectionStreamGate();
    expect([...raw].map((ch) => gate.push(ch)).join('')).toBe('');
  });
  it('streams ordinary prose and stops before an embedded protocol object', () => {
    const gate = new SelectionStreamGate();
    expect(gate.push('A natural ')).toBe('A natural ');
    expect(gate.push('translation.')).toBe('translation.');
    expect(gate.push('\n' + dictionary)).toBe('\n');
    expect(gate.push('more')).toBe('');
  });
  it('corrects a wrong dictionary result once using the entire source and text-only mode', async () => {
    const generate = vi.fn().mockResolvedValueOnce(dictionary).mockResolvedValueOnce('The complete translated passage.');
    expect(await runSelection(passage, 'translate', generate)).toEqual({ full: 'The complete translated passage.', format: 'text' });
    expect(generate.mock.calls).toEqual([['translate', false], ['translate', true]]);
  });
  it('never repairs recursively or returns the invalid raw response', async () => {
    const generate = vi.fn(async () => dictionary);
    await expect(runSelection(passage, 'translate', generate)).rejects.toBeInstanceOf(InvalidModelOutputError);
    expect(generate).toHaveBeenCalledTimes(2);
  });
  it('does not spend a correction request after abort', async () => {
    const ctl = new AbortController();
    const generate = vi.fn(async () => { ctl.abort(); return dictionary; });
    await expect(runSelection(passage, 'translate', generate, ctl.signal)).rejects.toThrow();
    expect(generate).toHaveBeenCalledTimes(1);
  });
});
