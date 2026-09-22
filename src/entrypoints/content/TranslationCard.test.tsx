import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/preact';

// The card talks to the background over chrome.runtime. None of that is under
// test here; what matters is what the card puts on screen for a given state.
vi.mock('~/messaging/client', () => ({
  streamTranslate: vi.fn(async function* () { /* never yields — the card stays streaming */ }),
  abortTranslate: () => {},
}));

import { TranslationCard } from './TranslationCard';
import { streamTranslate } from '~/messaging/client';
import { createDefaultProviders } from '~/storage/defaults';
import { DEFAULT_CARD_SIZE } from '~/core/card/size';
import type { TranslateResponse } from '~/messaging/types';

function rect(): DOMRect {
  return {
    top: 100, right: 400, bottom: 120, left: 200,
    width: 200, height: 20, x: 200, y: 100, toJSON() {},
  } as DOMRect;
}

const providers = createDefaultProviders();

function open(text: string, targetLang = 'zh-CN') {
  return render(
    <TranslationCard
      text={text}
      rect={rect()}
      locale="en"
      providers={providers}
      defaultProvider="microsoft"
      defaultTargetLang={targetLang}
      size={DEFAULT_CARD_SIZE}
      onClose={() => {}}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(streamTranslate).mockImplementation(async function* () {});
  vi.stubGlobal('requestAnimationFrame', () => 0);
  vi.stubGlobal('cancelAnimationFrame', () => {});
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('TranslationCard header', () => {
  it('names the language pair it is working between', () => {
    const { container } = open('The quick brown fox jumps over the lazy dog');
    const pair = container.querySelector('.bt-card-pair');
    expect(pair).not.toBeNull();
    expect(pair!.textContent).toContain('English');
    expect(pair!.textContent).toContain('简体中文');
  });

  it('follows the target the reader picked on this card, not only the setting', () => {
    const { container } = open('The quick brown fox', 'ja');
    expect(container.querySelector('.bt-card-pair')!.textContent).toContain('日本語');
  });

  it('labels substantial mixed text without declaring it English', () => {
    const { container } = open('我在花园日志中记录 soil moisture 和 rainfall，然后调整浇水次数。', 'en-AU');
    expect(container.querySelector('.bt-card-pair-lang')!.textContent).toBe('Mixed languages');
  });

  it('falls back to the card name when there is no language to read', () => {
    const { container } = open('12345 — 67.8%');
    expect(container.querySelector('.bt-card-pair')).toBeNull();
    expect(container.querySelector('.bt-card-brand-mark')).not.toBeNull();
  });

  it.each([
    ['这是一段中文，其中 includes English words。', 'zh-CN'],
    ['This English paragraph 包含中文 and must still be translated.', 'en'],
    ['This colour is already English.', 'en-AU'],
    ['这是一段中文', 'zh-CN'],
  ])('sends same-language and mixed selections instead of blocking: %s', async (text, targetLang) => {
    open(text, targetLang);
    await waitFor(() => expect(streamTranslate).toHaveBeenCalledWith(expect.objectContaining({ text, targetLang })));
  });
});

describe('TranslationCard footer', () => {
  it('offers the provider and the target language, one at each end', () => {
    const { container } = open('The quick brown fox');
    const buttons = container.querySelectorAll('.bt-card-foot-btn');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]!.textContent).toContain('Microsoft Translator');
    expect(buttons[1]!.textContent).toContain('简体中文');
  });

  it('keeps both controls for same-language input', () => {
    const { container } = open('这是一段中文', 'zh-CN');
    expect(container.querySelectorAll('.bt-card-foot-btn')).toHaveLength(2);
  });
});

function animate() {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => window.setTimeout(() => cb(0), 1));
  vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id));
}
function respond(messages: TranslateResponse[]) {
  vi.mocked(streamTranslate).mockImplementation(async function* () { yield* messages; });
}

describe('validated result rendering', () => {
  it('uses explicit dictionary metadata, not a textual fallback', async () => {
    respond([{ type: 'translate:done', requestId: 'r', cached: false, format: 'dictionary',
      full: JSON.stringify({ headword: 'rosemary', senses: ['An aromatic herb.'] }) }]);
    const { container } = open('rosemary');
    await waitFor(() => expect(container.querySelector('.bt-card-dict')).not.toBeNull());
    expect(container.textContent).not.toContain('"headword"');
  });
  it('does not render or copy malformed typed dictionary JSON', async () => {
    respond([{ type: 'translate:done', requestId: 'r', cached: false, format: 'dictionary', full: '{"headword":' }]);
    const { container } = open('rosemary');
    await waitFor(() => expect(container.querySelector('.bt-card-error')).not.toBeNull());
    expect(container.textContent).not.toContain('"headword"');
    expect((container.querySelector('[aria-label="Copy translation"]') as HTMLButtonElement).disabled).toBe(true);
  });
  it('rejects a terminal response without a recognized result type', async () => {
    respond([{ type: 'translate:done', requestId: 'r', cached: false, full: '{"headword":"unexpected"}' } as TranslateResponse]);
    const { container } = open('rosemary');
    await waitFor(() => expect(container.querySelector('.bt-card-error')).not.toBeNull());
    expect(container.textContent).not.toContain('"headword"');
  });
  it('keeps literal JSON translations as text when explicitly typed that way', async () => {
    animate();
    const full = '{"label":"Hello"}';
    respond([{ type: 'translate:done', requestId: 'r', cached: false, format: 'text', full }]);
    const { container } = open('{"label":"Bonjour"}');
    await waitFor(() => expect(container.querySelector('.bt-card-text')?.textContent).toBe(full));
    expect(container.querySelector('.bt-card-dict')).toBeNull();
  });
  it('resets old chunks and the typewriter cursor before a shorter corrected result', async () => {
    animate();
    vi.mocked(streamTranslate).mockImplementation(async function* (): AsyncGenerator<TranslateResponse> {
      yield { type: 'translate:chunk', requestId: 'r', delta: 'Discard this longer attempt.' };
      await new Promise((resolve) => setTimeout(resolve, 30));
      yield { type: 'translate:reset', requestId: 'r' };
      yield { type: 'translate:chunk', requestId: 'r', delta: 'OK' };
      yield { type: 'translate:done', requestId: 'r', full: 'OK', format: 'text', cached: false };
    });
    const { container } = open('A synthetic passage.');
    await waitFor(() => expect(container.querySelector('.bt-card-text')?.textContent).toBe('OK'));
    expect(container.textContent).not.toContain('Discard');
  });
});
