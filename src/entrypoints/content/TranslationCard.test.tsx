import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/preact';

// The card talks to the background over chrome.runtime. None of that is under
// test here; what matters is what the card puts on screen for a given state.
vi.mock('~/messaging/client', () => ({
  streamTranslate: async function* () { /* never yields — the card stays streaming */ },
  abortTranslate: () => {},
}));

import { TranslationCard } from './TranslationCard';
import { createDefaultProviders } from '~/storage/defaults';

function rect(): DOMRect {
  return {
    top: 100, right: 400, bottom: 120, left: 200,
    width: 200, height: 20, x: 200, y: 100, toJSON() {},
  } as DOMRect;
}

const providers = createDefaultProviders();

function open(text: string, targetLang = 'zh-CN', notice?: string) {
  return render(
    <TranslationCard
      text={text}
      rect={rect()}
      locale="en"
      providers={providers}
      defaultProvider="microsoft"
      defaultTargetLang={targetLang}
      notice={notice}
      onClose={() => {}}
    />,
  );
}

beforeEach(() => {
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
    expect(pair!.textContent).toContain('(auto)');
  });

  it('follows the target the reader picked on this card, not only the setting', () => {
    const { container } = open('The quick brown fox', 'ja');
    expect(container.querySelector('.bt-card-pair')!.textContent).toContain('日本語');
  });

  it('falls back to the card name when there is no language to read', () => {
    const { container } = open('12345 — 67.8%');
    expect(container.querySelector('.bt-card-pair')).toBeNull();
    expect(container.querySelector('.bt-card-brand-mark')).not.toBeNull();
  });

  it('shows the pair over a notice too, which is what explains the notice', () => {
    // "Already in your target language" is exactly the case where both sides of
    // the pair read the same, so the line is the reason rather than a repetition.
    const { container } = open('这是一段中文', 'zh-CN', 'Already in your language');
    const pair = container.querySelector('.bt-card-pair')!;
    expect(pair.textContent).toContain('简体中文');
    expect(container.querySelector('.bt-card-notice')!.textContent).toBe('Already in your language');
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

  it('keeps the language control under a notice — it is the way out of one', () => {
    const { container } = open('这是一段中文', 'zh-CN', 'Already in your language');
    const buttons = container.querySelectorAll('.bt-card-foot-btn');
    // Nobody translated anything, so there is nothing to credit; the language
    // control stays, because picking another one is what clears the notice.
    expect(buttons).toHaveLength(1);
    expect(buttons[0]!.className).toContain('bt-card-foot-lang');
  });
});
