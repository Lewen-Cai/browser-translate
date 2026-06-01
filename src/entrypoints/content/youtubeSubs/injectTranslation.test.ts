import { describe, it, expect, beforeEach } from 'vitest';
import { createCaptionInjector } from './injectTranslation';

function setup(html: string) {
  document.body.innerHTML = html;
}

const WITH_CAPTION =
  '<div class="ytp-caption-window-container"><div class="captions-text">' +
  '<span class="caption-visual-line"><span class="ytp-caption-segment">Hello</span></span>' +
  '</div></div>';

describe('createCaptionInjector', () => {
  beforeEach(() => setup(''));

  it('appends the translation under the on-screen caption', () => {
    setup(WITH_CAPTION);
    const injector = createCaptionInjector({
      getTranslation: (native) => (native === 'Hello' ? '你好' : undefined),
      placeholder: '翻译中…',
    });
    injector.refresh();
    const line = document.querySelector('.bt-yt-translation');
    expect(line?.textContent).toBe('你好');
    expect(document.querySelectorAll('.bt-yt-translation')).toHaveLength(1);
  });

  it('shows the placeholder while the translation is not ready', () => {
    setup(WITH_CAPTION);
    const injector = createCaptionInjector({
      getTranslation: () => undefined,
      placeholder: '翻译中…',
    });
    injector.refresh();
    expect(document.querySelector('.bt-yt-translation')?.textContent).toBe('翻译中…');
  });

  it('removes the line when no caption is on screen', () => {
    setup('<div class="ytp-caption-window-container"></div>');
    const injector = createCaptionInjector({ getTranslation: () => '你好', placeholder: 'p' });
    injector.refresh();
    expect(document.querySelector('.bt-yt-translation')).toBeNull();
  });

  it('updates the line text when the translation changes', () => {
    setup(WITH_CAPTION);
    let cur: string | undefined = '甲';
    const injector = createCaptionInjector({ getTranslation: () => cur, placeholder: 'p' });
    injector.refresh();
    cur = '乙';
    injector.refresh();
    const lines = document.querySelectorAll('.bt-yt-translation');
    expect(lines).toHaveLength(1);
    expect(lines[0]!.textContent).toBe('乙');
  });

  it('teardown removes injected lines', () => {
    setup(WITH_CAPTION);
    const injector = createCaptionInjector({ getTranslation: () => '甲', placeholder: 'p' });
    injector.refresh();
    injector.teardown();
    expect(document.querySelector('.bt-yt-translation')).toBeNull();
  });
});
