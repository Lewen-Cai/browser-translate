import { describe, it, expect, afterEach, vi } from 'vitest';
import { streamTranslate } from './client';

const originalChrome = (globalThis as { chrome?: unknown }).chrome;

afterEach(() => {
  (globalThis as { chrome?: unknown }).chrome = originalChrome;
});

describe('streamTranslate attempt protocol', () => {
  it('keeps resets non-terminal and ignores unrelated messages with the same id', async () => {
    let listener: (message: unknown) => void = () => {};
    const removeListener = vi.fn();
    (globalThis as { chrome?: unknown }).chrome = { runtime: {
      id: 'fixture',
      onMessage: { addListener: (fn: typeof listener) => { listener = fn; }, removeListener },
      sendMessage: async () => {
        for (const message of [
          { type: 'translate', requestId: 'r', text: 'not a response' },
          { type: 'translate:chunk', requestId: 'another', delta: 'ignore' },
          { type: 'translate:reset', requestId: 'r' },
          { type: 'translate:chunk', requestId: 'r', delta: 'discarded' },
          { type: 'translate:reset', requestId: 'r' },
          { type: 'translate:chunk', requestId: 'r', delta: 'valid' },
          { type: 'translate:done', requestId: 'r', full: 'valid', format: 'text', cached: false },
        ]) listener(message);
      },
    } };
    const messages = [];
    for await (const message of streamTranslate({ type: 'translate', requestId: 'r', text: 'input' })) messages.push(message);
    expect(messages.map((m) => m.type)).toEqual(['translate:reset', 'translate:chunk', 'translate:reset', 'translate:chunk', 'translate:done']);
    expect(removeListener).toHaveBeenCalled();
  });
});

describe('streamTranslate context guard', () => {
  async function drain(req: Parameters<typeof streamTranslate>[0]): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of streamTranslate(req)) { /* exhaust */ }
  }

  it('throws a refresh-actionable error when the extension context is invalidated', async () => {
    // Orphaned content script after an extension reload: chrome.runtime is undefined.
    (globalThis as { chrome?: unknown }).chrome = {};
    await expect(drain({ type: 'translate', requestId: 'r1', text: 'hi' })).rejects.toThrow(/context invalidated/i);
  });

  it('throws when chrome.runtime has lost its id', async () => {
    (globalThis as { chrome?: unknown }).chrome = { runtime: {} };
    await expect(drain({ type: 'translate', requestId: 'r2', text: 'hi' })).rejects.toThrow(/context invalidated/i);
  });
});
