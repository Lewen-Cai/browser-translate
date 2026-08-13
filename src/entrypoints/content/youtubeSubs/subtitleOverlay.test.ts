import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSubtitleOverlay, type SubtitleLines } from './subtitleOverlay';

const PLAYER_HEIGHT = 500;

function setup(lines: SubtitleLines | null, offsetPct = 0.11) {
  let current = lines;
  const onOffsetChange = vi.fn();
  const overlay = createSubtitleOverlay({
    getLines: () => current,
    placeholder: '翻译中…',
    dragHint: 'drag me',
    getOffsetPct: () => offsetPct,
    onOffsetChange,
    getAppearance: () => ({ fontScale: 100, backgroundOpacity: 78, translationOnly: false }),
  });
  return { overlay, onOffsetChange, setLines: (l: SubtitleLines | null) => { current = l; } };
}

function pointer(type: string, clientY: number): PointerEvent {
  const e = new MouseEvent(type, { bubbles: true, clientY }) as unknown as PointerEvent;
  Object.defineProperty(e, 'pointerId', { value: 1 });
  return e;
}

const block = () => document.querySelector<HTMLElement>('.bt-yt-subs > div');
const handle = () => document.querySelector<HTMLElement>('.bt-yt-subs-handle');
const original = () => document.querySelector<HTMLElement>('.bt-yt-line-original');
const translation = () => document.querySelector<HTMLElement>('.bt-yt-line-translation');

beforeEach(() => {
  document.body.innerHTML = '<div id="movie_player"></div>';
  document.head.innerHTML = '';
  Object.defineProperty(document.querySelector('#movie_player'), 'clientHeight', {
    value: PLAYER_HEIGHT, configurable: true,
  });
});

describe('createSubtitleOverlay', () => {
  it('mounts inside the player and hides the native captions while active', () => {
    const { overlay } = setup({ original: 'Hello', translation: '你好' });
    overlay.start();

    expect(document.querySelector('#movie_player .bt-yt-subs')).not.toBeNull();
    expect(document.getElementById('bt-yt-subs-style')?.textContent)
      .toContain('.ytp-caption-window-container');

    overlay.teardown();
    expect(document.querySelector('.bt-yt-subs')).toBeNull();
    expect(document.getElementById('bt-yt-subs-style')).toBeNull();
  });

  it('shows the original immediately and a placeholder until the translation lands', () => {
    const { overlay, setLines } = setup({ original: 'Hello', translation: null });
    overlay.start();

    expect(original()?.textContent).toBe('Hello');
    expect(translation()?.textContent).toBe('翻译中…');
    expect(translation()?.dataset.btPlaceholder).toBe('true');

    setLines({ original: 'Hello', translation: '你好' });
    overlay.refresh();
    expect(translation()?.textContent).toBe('你好');
    expect(translation()?.dataset.btPlaceholder).toBe('false');
  });

  it('blanks both lines when no cue is active', () => {
    const { overlay, setLines } = setup({ original: 'Hello', translation: '你好' });
    overlay.start();
    setLines(null);
    overlay.refresh();

    expect(original()?.style.display).toBe('none');
    expect(translation()?.style.display).toBe('none');
  });

  it('does nothing when the player is not on the page yet', () => {
    document.body.innerHTML = '';
    const { overlay } = setup({ original: 'Hello', translation: '你好' });
    expect(() => overlay.start()).not.toThrow();
    expect(document.querySelector('.bt-yt-subs')).toBeNull();
  });

  it('raises the block when dragged up and reports the new position once', () => {
    const { overlay, onOffsetChange } = setup({ original: 'Hello', translation: '你好' }, 0.1);
    overlay.start();
    const el = block()!;
    const grip = handle()!;

    grip.dispatchEvent(pointer('pointerdown', 400));
    window.dispatchEvent(pointer('pointermove', 300)); // 100px up on a 500px player = +0.2
    expect(el.style.bottom).toBe('30%');
    expect(onOffsetChange).not.toHaveBeenCalled();

    window.dispatchEvent(pointer('pointerup', 300));
    expect(onOffsetChange).toHaveBeenCalledTimes(1);
    expect(onOffsetChange.mock.calls[0]![0]).toBeCloseTo(0.3);
  });

  it('keeps the block inside the player when dragged past the edge', () => {
    const { overlay, onOffsetChange } = setup({ original: 'Hello', translation: '你好' }, 0.1);
    overlay.start();
    const grip = handle()!;

    grip.dispatchEvent(pointer('pointerdown', 400));
    window.dispatchEvent(pointer('pointermove', -2000)); // way above the top edge
    window.dispatchEvent(pointer('pointerup', -2000));

    expect(onOffsetChange.mock.calls[0]![0]).toBeLessThanOrEqual(0.8);
  });

  it('does not write back a press that never moved', () => {
    const { overlay, onOffsetChange } = setup({ original: 'Hello', translation: '你好' }, 0.1);
    overlay.start();
    const grip = handle()!;

    grip.dispatchEvent(pointer('pointerdown', 400));
    window.dispatchEvent(pointer('pointermove', 401));
    window.dispatchEvent(pointer('pointerup', 401));

    expect(onOffsetChange).not.toHaveBeenCalled();
  });

  it('shows the original alone once a cue is known to have failed', () => {
    const { overlay } = setup({ original: 'Hello', translation: null, failed: true });
    overlay.start();

    expect(original()?.textContent).toBe('Hello');
    expect(translation()?.style.display).toBe('none');
  });

  it('drops the source line in translation-only mode', () => {
    let current: SubtitleLines | null = { original: 'Hello', translation: '你好' };
    const overlay = createSubtitleOverlay({
      getLines: () => current,
      placeholder: '翻译中…',
      dragHint: 'drag me',
      getOffsetPct: () => 0.11,
      onOffsetChange: vi.fn(),
      getAppearance: () => ({ fontScale: 100, backgroundOpacity: 78, translationOnly: true }),
    });
    overlay.start();

    expect(original()?.style.display).toBe('none');
    expect(translation()?.textContent).toBe('你好');
    current = null;
  });

  it('applies the configured font scale on top of the player-derived size', () => {
    const overlay = createSubtitleOverlay({
      getLines: () => ({ original: 'Hello', translation: '你好' }),
      placeholder: '…',
      dragHint: 'drag me',
      getOffsetPct: () => 0.11,
      onOffsetChange: vi.fn(),
      getAppearance: () => ({ fontScale: 200, backgroundOpacity: 0, translationOnly: false }),
    });
    overlay.start();

    // 500px player -> 17.5px automatic size, doubled by the 200% scale.
    expect(block()?.style.fontSize).toBe('35px');
    expect(original()?.style.background).toContain('rgba(8, 8, 8, 0)');
  });

  it('lifts the block clear of the control bar while it is on screen', () => {
    const host = document.querySelector('#movie_player')!;
    const bar = document.createElement('div');
    bar.className = 'ytp-chrome-bottom';
    bar.getBoundingClientRect = () => ({ height: 50 }) as DOMRect;
    host.appendChild(bar);

    const { overlay } = setup({ original: 'Hello', translation: '你好' }, 0.1);
    overlay.start();
    // 10% chosen position + 50/500 of control bar.
    expect(block()?.style.bottom).toBe('20%');

    host.classList.add('ytp-autohide');
    overlay.refresh();
    expect(block()?.style.bottom).toBe('10%');
  });

  it('ignores pointer movement that did not start with a grab', () => {
    const { overlay, onOffsetChange } = setup({ original: 'Hello', translation: '你好' }, 0.1);
    overlay.start();
    const el = block()!;

    window.dispatchEvent(pointer('pointermove', 100));
    expect(el.style.bottom).toBe('10%');
    expect(onOffsetChange).not.toHaveBeenCalled();
  });
});
