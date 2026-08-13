import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSubtitleOverlay, type SubtitleLines } from './subtitleOverlay';

const PLAYER_HEIGHT = 500;

function setup(lines: SubtitleLines | null, offsetPct = 0.11) {
  let current = lines;
  let appearance = { fontScale: 100, backgroundOpacity: 78, translationOnly: false };
  const onOffsetChange = vi.fn();
  const onAppearanceChange = vi.fn((next: typeof appearance) => { appearance = next; });
  const overlay = createSubtitleOverlay({
    getLines: () => current,
    strings: {
      placeholder: '翻译中…',
      dragHint: 'drag me',
      settings: 'settings',
      fontScale: 'size',
      backgroundOpacity: 'backdrop',
      translationOnly: 'translation only',
      resetPosition: 'reset',
    },
    getOffsetPct: () => offsetPct,
    onOffsetChange,
    onAppearanceChange,
    getAppearance: () => appearance,
  });
  return {
    overlay,
    onOffsetChange,
    onAppearanceChange,
    setLines: (l: SubtitleLines | null) => {
      current = l;
    },
  };
}

function pointer(type: string, clientY: number): PointerEvent {
  const e = new MouseEvent(type, { bubbles: true, clientY }) as unknown as PointerEvent;
  Object.defineProperty(e, 'pointerId', { value: 1 });
  return e;
}

/** The overlay lives in a shadow root, so every lookup goes through the host. */
function inShadow<T extends HTMLElement>(selector: string): T | null {
  const shadowHost = document.querySelector<HTMLElement>('.bt-yt-subs');
  return shadowHost?.shadowRoot?.querySelector<T>(selector) ?? null;
}

const block = () => inShadow('.block');
const handle = () => inShadow('.handle');
const gear = () => inShadow('.gear');
const panel = () => inShadow('.panel');
const original = () => inShadow('.bt-yt-line-original');
const translation = () => inShadow('.bt-yt-line-translation');

beforeEach(() => {
  document.body.innerHTML = '<div id="movie_player"></div>';
  document.head.innerHTML = '';
  Object.defineProperty(document.querySelector('#movie_player'), 'clientHeight', {
    value: PLAYER_HEIGHT,
    configurable: true,
  });
});

describe('createSubtitleOverlay', () => {
  it('mounts inside the player and hides the native captions while active', () => {
    const { overlay } = setup({ original: 'Hello', translation: '你好' });
    overlay.start();

    expect(document.querySelector('#movie_player .bt-yt-subs')).not.toBeNull();
    expect(document.getElementById('bt-yt-subs-style')?.textContent).toContain(
      '.ytp-caption-window-container',
    );

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
      strings: {
        placeholder: '翻译中…',
        dragHint: 'drag me',
        settings: 'settings',
        fontScale: 'size',
        backgroundOpacity: 'backdrop',
        translationOnly: 'translation only',
        resetPosition: 'reset',
      },
      getOffsetPct: () => 0.11,
      onOffsetChange: vi.fn(),
      onAppearanceChange: vi.fn(),
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
      strings: {
        placeholder: '翻译中…',
        dragHint: 'drag me',
        settings: 'settings',
        fontScale: 'size',
        backgroundOpacity: 'backdrop',
        translationOnly: 'translation only',
        resetPosition: 'reset',
      },
      getOffsetPct: () => 0.11,
      onOffsetChange: vi.fn(),
      onAppearanceChange: vi.fn(),
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

describe('subtitle settings panel', () => {
  it('stays closed until the gear is used', () => {
    const { overlay } = setup({ original: 'Hello', translation: '你好' });
    overlay.start();
    expect(panel()?.style.display).toBe('none');

    gear()!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(panel()?.style.display).toBe('block');
  });

  it('reports a size change and re-lays out immediately', () => {
    const { overlay, onAppearanceChange } = setup({ original: 'Hello', translation: '你好' });
    overlay.start();
    gear()!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // First row is size; its second button is the increment.
    const plus = panel()!.querySelectorAll<HTMLButtonElement>('.stepper button')[1]!;
    plus.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onAppearanceChange).toHaveBeenCalledWith(
      expect.objectContaining({ fontScale: 110 }),
    );
    // 500px player -> 17.5px automatic size, scaled by 110%.
    expect(block()?.style.fontSize).toBe('19px');
  });

  it('clamps the size at the bottom of its range', () => {
    const { overlay, onAppearanceChange } = setup({ original: 'Hello', translation: '你好' });
    overlay.start();
    gear()!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    for (let i = 0; i < 12; i++) {
      panel()!.querySelectorAll<HTMLButtonElement>('.stepper button')[0]!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
    const last = onAppearanceChange.mock.calls.at(-1)![0];
    expect(last.fontScale).toBe(50);
  });

  it('puts the block back at the default position on reset', () => {
    const { overlay, onOffsetChange } = setup({ original: 'Hello', translation: '你好' }, 0.5);
    overlay.start();
    gear()!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    panel()!.querySelector<HTMLButtonElement>('.reset')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onOffsetChange).toHaveBeenCalledWith(0.11);
    expect(block()?.style.bottom).toBe('11%');
  });

  it('keeps a press on the panel away from the player underneath', () => {
    const { overlay } = setup({ original: 'Hello', translation: '你好' });
    overlay.start();
    gear()!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const reachedPage = vi.fn();
    document.addEventListener('pointerdown', reachedPage);
    panel()!.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    document.removeEventListener('pointerdown', reachedPage);

    expect(reachedPage).not.toHaveBeenCalled();
  });
});
