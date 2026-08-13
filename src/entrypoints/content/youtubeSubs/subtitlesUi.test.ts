import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSubtitlesUi, type SubtitleLines, type SubtitleUiStrings } from './subtitlesUi';
import {
  DEFAULT_SUBTITLE_POSITION,
  DEFAULT_SUBTITLE_STYLE,
  type SubtitlePosition,
  type SubtitleStyle,
} from '~/core/subtitles/style';

const PLAYER_HEIGHT = 400;

const STRINGS: SubtitleUiStrings = {
  placeholder: '翻译中…',
  dragHint: 'drag me',
  subtitlesToggle: 'Bilingual subtitles',
  styleTitle: 'Subtitle style',
  general: 'General',
  displayMode: 'Display mode',
  displayBilingual: 'Bilingual',
  displayOriginalOnly: 'Original only',
  displayTranslationOnly: 'Translation only',
  translationPosition: 'Translation position',
  positionAbove: 'Above',
  positionBelow: 'Below',
  backgroundOpacity: 'Background opacity',
  mainSubtitle: 'Original subtitle',
  translationSubtitle: 'Translated subtitle',
  fontScale: 'Font scale',
  color: 'Color',
  fontFamily: 'Font',
  fontWeight: 'Font weight',
  reset: 'Reset',
  resetPosition: 'Reset position',
  back: 'Back',
};

function setup(lines: SubtitleLines | null, options: {
  position?: SubtitlePosition;
  style?: SubtitleStyle;
  active?: boolean;
} = {}) {
  let current = lines;
  let position = options.position ?? DEFAULT_SUBTITLE_POSITION;
  let style = options.style ?? DEFAULT_SUBTITLE_STYLE;
  let active = false;
  const onPositionChange = vi.fn((next: SubtitlePosition) => { position = next; });
  const onStyleChange = vi.fn((next: SubtitleStyle) => { style = next; });
  const onActiveChange = vi.fn((next: boolean) => { active = next; ui.setActive(next); });

  const ui = createSubtitlesUi({
    getLines: () => current,
    strings: STRINGS,
    getPosition: () => position,
    onPositionChange,
    getStyle: () => style,
    onStyleChange,
    isActive: () => active,
    onActiveChange,
  });

  if (options.active !== false) {
    active = true;
    ui.setActive(true);
  }

  return {
    ui,
    onPositionChange,
    onStyleChange,
    onActiveChange,
    getStyle: () => style,
    setLines: (l: SubtitleLines | null) => { current = l; },
  };
}

function pointer(type: string, clientY: number): PointerEvent {
  const e = new MouseEvent(type, { bubbles: true, clientY }) as unknown as PointerEvent;
  Object.defineProperty(e, 'pointerId', { value: 1 });
  return e;
}

/** Everything lives in a shadow root, so every lookup goes through the host. */
function inShadow<T extends HTMLElement>(selector: string): T | null {
  const shadowHost = document.querySelector<HTMLElement>('.bt-yt-subs');
  return shadowHost?.shadowRoot?.querySelector<T>(selector) ?? null;
}

const windowEl = () => inShadow('.window');
const group = () => inShadow('.group');
const grip = () => inShadow('.grip');
const plate = () => inShadow('.plate');
const original = () => inShadow('.line-main');
const translation = () => inShadow('.line-translation');
const panel = () => inShadow('.panel');

function player(): HTMLElement {
  return document.querySelector<HTMLElement>('#movie_player')!;
}

/** jsdom lays nothing out, so the geometry the drag reads has to be supplied. */
function stubRects(groupTop: number, groupHeight: number): void {
  player().getBoundingClientRect = () =>
    ({ top: 0, left: 0, height: PLAYER_HEIGHT, width: 800 }) as DOMRect;
  const g = group();
  if (g) {
    g.getBoundingClientRect = () =>
      ({ top: groupTop, left: 0, height: groupHeight, width: 400 }) as DOMRect;
  }
}

beforeEach(() => {
  document.body.innerHTML = '<div id="movie_player"></div>';
  document.head.innerHTML = '';
  Object.defineProperty(player(), 'clientHeight', {
    value: PLAYER_HEIGHT,
    configurable: true,
  });
});

describe('mounting', () => {
  it('lives in a shadow root inside the player and hides the native captions', () => {
    const { ui } = setup({ original: 'Hello', translation: '你好' });

    expect(document.querySelector('#movie_player .bt-yt-subs')).not.toBeNull();
    expect(inShadow('.window')).not.toBeNull();
    expect(document.getElementById('bt-yt-subs-style')?.textContent)
      .toContain('.ytp-caption-window-container');

    ui.teardown();
    expect(document.querySelector('.bt-yt-subs')).toBeNull();
    expect(document.getElementById('bt-yt-subs-style')).toBeNull();
  });

  it('gives the player a containing block so the overlay can be positioned in it', () => {
    setup(null);
    expect(player().style.position).toBe('relative');
  });

  it('restores the native captions when translation is switched off', () => {
    const { ui } = setup({ original: 'Hello', translation: null });
    expect(document.getElementById('bt-yt-subs-style')).not.toBeNull();
    ui.setActive(false);
    expect(document.getElementById('bt-yt-subs-style')).toBeNull();
    expect(group()?.dataset.hidden).toBe('true');
  });
});

describe('drawing the lines', () => {
  it('shows the original immediately and a placeholder until the translation lands', () => {
    const { ui, setLines } = setup({ original: 'Hello', translation: null });
    expect(original()?.textContent).toBe('Hello');
    expect(translation()?.textContent).toBe('翻译中…');
    expect(translation()?.dataset.placeholder).toBe('true');

    setLines({ original: 'Hello', translation: '你好' });
    ui.refresh();
    expect(translation()?.textContent).toBe('你好');
    expect(translation()?.dataset.placeholder).toBe('false');
  });

  it('drops the placeholder and shows the original alone once a cue has failed', () => {
    setup({ original: 'Hello', translation: null, failed: true });
    expect(original()?.textContent).toBe('Hello');
    expect(translation()?.dataset.empty).toBe('true');
  });

  it('hides the plate between cues but keeps the grip in place', () => {
    const { ui, setLines } = setup({ original: 'Hello', translation: '你好' });
    setLines(null);
    ui.refresh();
    expect(plate()?.dataset.empty).toBe('true');
    expect(grip()).not.toBeNull();
  });

  it('draws only the translation in translationOnly mode', () => {
    setup({ original: 'Hello', translation: '你好' }, {
      style: { ...DEFAULT_SUBTITLE_STYLE, displayMode: 'translationOnly' },
    });
    expect(original()?.dataset.empty).toBe('true');
    expect(translation()?.textContent).toBe('你好');
  });

  it('falls back to the original in translationOnly mode while the translation is pending', () => {
    setup({ original: 'Hello', translation: null }, {
      style: { ...DEFAULT_SUBTITLE_STYLE, displayMode: 'translationOnly' },
    });
    expect(translation()?.textContent).toBe('翻译中…');
  });

  it('draws only the original in originalOnly mode', () => {
    setup({ original: 'Hello', translation: '你好' }, {
      style: { ...DEFAULT_SUBTITLE_STYLE, displayMode: 'originalOnly' },
    });
    expect(original()?.textContent).toBe('Hello');
    expect(translation()?.dataset.empty).toBe('true');
  });
});

describe('style', () => {
  it('applies each line style and the plate opacity', () => {
    setup({ original: 'Hello', translation: '你好' }, {
      style: {
        ...DEFAULT_SUBTITLE_STYLE,
        backgroundOpacity: 50,
        main: { fontScale: 120, color: '#ff0000', fontFamily: 'serif', fontWeight: 700 },
        translation: { fontScale: 90, color: '#00ff00', fontFamily: 'kai', fontWeight: 300 },
      },
    });
    expect(original()?.style.fontSize).toBe('1.2em');
    expect(original()?.style.fontWeight).toBe('700');
    expect(original()?.style.fontFamily).toContain('Noto Serif');
    expect(translation()?.style.fontSize).toBe('0.9em');
    expect(translation()?.style.fontFamily).toContain('KaiTi');
    expect(plate()?.style.background).toBe('rgba(0, 0, 0, 0.5)');
  });

  it('puts the translation first when it is set to sit above', () => {
    setup({ original: 'Hello', translation: '你好' }, {
      style: { ...DEFAULT_SUBTITLE_STYLE, translationPosition: 'above' },
    });
    expect(translation()?.style.order).toBe('1');
    expect(original()?.style.order).toBe('2');
  });

  it('sizes the text from the player height so fullscreen needs no special case', () => {
    const { ui } = setup({ original: 'Hello', translation: '你好' });
    expect(windowEl()?.style.fontSize).toBe('14px'); // 400 * 0.035

    Object.defineProperty(player(), 'clientHeight', { value: 2000, configurable: true });
    ui.refresh();
    expect(windowEl()?.style.fontSize).toBe('44px'); // capped
  });
});

describe('position', () => {
  it('offsets from the bottom edge by the stored percentage', () => {
    setup({ original: 'Hello', translation: '你好' }, {
      position: { percent: 10, anchor: 'bottom' },
    });
    expect(group()?.style.bottom).toBe('10%');
    expect(group()?.style.top).toBe('auto');
  });

  it('offsets from the top edge when anchored there', () => {
    setup({ original: 'Hello', translation: '你好' }, {
      position: { percent: 15, anchor: 'top' },
    });
    expect(group()?.style.top).toBe('15%');
    expect(group()?.style.bottom).toBe('auto');
  });

  it('lifts clear of the control bar while it is on screen', () => {
    const bar = document.createElement('div');
    bar.className = 'ytp-chrome-bottom';
    bar.getBoundingClientRect = () => ({ height: 40 }) as DOMRect;
    player().appendChild(bar);

    const { ui } = setup({ original: 'Hello', translation: '你好' }, {
      position: { percent: 6, anchor: 'bottom' },
    });
    ui.refresh();
    expect(group()?.style.bottom).toBe('16%'); // 6 + 40/400

    player().classList.add('ytp-autohide');
    ui.refresh();
    expect(group()?.style.bottom).toBe('6%');
  });
});

describe('dragging', () => {
  it('moves the block and stores the release position', () => {
    const { onPositionChange } = setup({ original: 'Hello', translation: '你好' }, {
      position: { percent: 5, anchor: 'bottom' },
    });
    stubRects(340, 40);

    grip()!.dispatchEvent(pointer('pointerdown', 360));
    // 100px up: top 340 → 240, so the block's bottom edge is 400 - 280 = 120 away.
    window.dispatchEvent(pointer('pointermove', 260));
    expect(group()?.style.bottom).toBe('30%');
    expect(onPositionChange).not.toHaveBeenCalled();

    window.dispatchEvent(pointer('pointerup', 260));
    expect(onPositionChange).toHaveBeenCalledWith({ percent: 30, anchor: 'bottom' });
  });

  it('switches to the top edge once the block passes the middle of the picture', () => {
    const { onPositionChange } = setup({ original: 'Hello', translation: '你好' }, {
      position: { percent: 5, anchor: 'bottom' },
    });
    stubRects(340, 40);

    grip()!.dispatchEvent(pointer('pointerdown', 360));
    window.dispatchEvent(pointer('pointermove', 120)); // top 340 → 100, centre 120 < 200
    window.dispatchEvent(pointer('pointerup', 120));

    expect(onPositionChange).toHaveBeenCalledWith({ percent: 25, anchor: 'top' });
    expect(group()?.style.top).toBe('25%');
  });

  it('keeps the block inside the player', () => {
    const { onPositionChange } = setup({ original: 'Hello', translation: '你好' });
    stubRects(340, 40);

    grip()!.dispatchEvent(pointer('pointerdown', 360));
    window.dispatchEvent(pointer('pointermove', -5000));
    window.dispatchEvent(pointer('pointerup', -5000));

    expect(onPositionChange).toHaveBeenCalledWith({ percent: 0, anchor: 'top' });
  });

  it('does not store a position for a press that never moved', () => {
    const { onPositionChange } = setup({ original: 'Hello', translation: '你好' });
    stubRects(340, 40);

    grip()!.dispatchEvent(pointer('pointerdown', 360));
    window.dispatchEvent(pointer('pointermove', 361));
    window.dispatchEvent(pointer('pointerup', 361));

    expect(onPositionChange).not.toHaveBeenCalled();
  });

  it('keeps the gesture off the player underneath', () => {
    setup({ original: 'Hello', translation: '你好' });
    stubRects(340, 40);
    const seen = vi.fn();
    player().addEventListener('pointerdown', seen);

    grip()!.dispatchEvent(pointer('pointerdown', 360));
    expect(seen).not.toHaveBeenCalled();
  });

  it('eats the click the release generates', () => {
    // Once the block hits a clamp it stops tracking the pointer, so the release
    // lands on the picture and the browser follows it with a click on the
    // player. On YouTube that pauses the video, or navigates away from an end
    // screen — taking the translation with it.
    setup({ original: 'Hello', translation: '你好' });
    stubRects(340, 40);
    const clicked = vi.fn();
    player().addEventListener('click', clicked);

    grip()!.dispatchEvent(pointer('pointerdown', 360));
    window.dispatchEvent(pointer('pointermove', 200));
    window.dispatchEvent(pointer('pointerup', 200));
    player().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(clicked).not.toHaveBeenCalled();

    // Only the one, though: the next click is the viewer's own.
    player().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(clicked).toHaveBeenCalledTimes(1);
  });

  it('leaves an ordinary click on the player alone', () => {
    setup({ original: 'Hello', translation: '你好' });
    const clicked = vi.fn();
    player().addEventListener('click', clicked);

    player().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(clicked).toHaveBeenCalledTimes(1);
  });
});

describe('settings panel', () => {
  it('opens and closes, and closes again on Escape', () => {
    const { ui } = setup(null);
    expect(panel()?.dataset.open).toBe('false');

    ui.togglePanel();
    expect(panel()?.dataset.open).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(panel()?.dataset.open).toBe('false');
  });

  it('closes on a press outside it but not on one inside', () => {
    const { ui } = setup(null);
    ui.togglePanel();

    panel()!.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, composed: true }));
    expect(panel()?.dataset.open).toBe('true');

    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(panel()?.dataset.open).toBe('false');
  });

  it('turns translation on and off from the switch in the menu', () => {
    const { ui, onActiveChange } = setup(null, { active: false });
    ui.togglePanel();

    const toggle = inShadow<HTMLButtonElement>('.switch')!;
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    toggle.click();

    expect(onActiveChange).toHaveBeenCalledWith(true);
    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });

  it('reaches the style page and writes a change back', () => {
    const { ui, onStyleChange, getStyle } = setup(null);
    ui.togglePanel();

    // Second menu entry is the route into the style settings.
    const entries = document.querySelector<HTMLElement>('.bt-yt-subs')!
      .shadowRoot!.querySelectorAll<HTMLElement>('.menu-item');
    entries[1]!.click();

    const select = inShadow<HTMLSelectElement>('.rows select')!;
    select.value = 'translationOnly';
    select.dispatchEvent(new Event('change'));

    expect(onStyleChange).toHaveBeenCalled();
    expect(getStyle().displayMode).toBe('translationOnly');
  });

  it('resets the position from the style page', () => {
    const { ui, onPositionChange } = setup(null, { position: { percent: 40, anchor: 'top' } });
    ui.togglePanel();
    const shadow = document.querySelector<HTMLElement>('.bt-yt-subs')!.shadowRoot!;
    shadow.querySelectorAll<HTMLElement>('.menu-item')[1]!.click();

    const items = shadow.querySelectorAll<HTMLElement>('.menu-item');
    items[items.length - 1]!.click();

    expect(onPositionChange).toHaveBeenCalledWith({ percent: 6, anchor: 'bottom' });
    expect(group()?.style.bottom).toBe('6%');
  });
});
