import { clampSubtitleBackgroundOpacity, clampSubtitleFontScale, clampSubtitleOffset, DEFAULT_SUBTITLE_OFFSET_PCT } from '~/core/subtitles/layout';

const PLAYER_SEL = '#movie_player';
const NATIVE_CAPTIONS_SEL = '.ytp-caption-window-container';
const CONTROLS_SEL = '.ytp-chrome-bottom';
/** YouTube adds this class to the player while the control bar is hidden. */
const AUTOHIDE_CLASS = 'ytp-autohide';
const FALLBACK_CONTROLS_HEIGHT = 48;

const HOST_CLASS = 'bt-yt-subs';
const STYLE_ID = 'bt-yt-subs-style';

/** Movement under this many pixels is a press, not a reposition. */
const CLICK_SLOP = 3;

const FONT_SCALE_STEP = 10;
const OPACITY_STEP = 10;

export interface SubtitleLines {
  original: string;
  /** null while the translation for this cue is still in flight. */
  translation: string | null;
  /** true once the translation is known not to be coming — show the original alone. */
  failed?: boolean;
}

export interface SubtitleAppearance {
  /** Percentage of the automatic size, 50–200. */
  fontScale: number;
  /** Backing plate opacity behind the text, 0–100. */
  backgroundOpacity: number;
  /** Hide the source line and show only the translation. */
  translationOnly: boolean;
}

export interface SubtitleOverlayStrings {
  /** Shown in place of the translation while it is still being produced. */
  placeholder: string;
  dragHint: string;
  settings: string;
  fontScale: string;
  backgroundOpacity: string;
  translationOnly: string;
  resetPosition: string;
}

export interface SubtitleOverlayDeps {
  /** The lines to show right now, or null when no cue is active. */
  getLines: () => SubtitleLines | null;
  strings: SubtitleOverlayStrings;
  getOffsetPct: () => number;
  /** Called once per drag, when the pointer is released. */
  onOffsetChange: (pct: number) => void;
  getAppearance: () => SubtitleAppearance;
  onAppearanceChange: (next: SubtitleAppearance) => void;
}

export interface SubtitleOverlay {
  refresh: () => void;
  start: () => void;
  teardown: () => void;
}

/**
 * The subtitle overlay: our own two lines drawn over the player, with YouTube's
 * caption container hidden while translation is on.
 *
 * It lives in a shadow root rather than as plain nodes in the player. The page
 * we are drawing into is one of the most heavily scripted and styled on the
 * web, and it rebuilds parts of the player as the viewer resizes, goes
 * fullscreen or moves through the video. A shadow root keeps YouTube's CSS off
 * our elements and ours off theirs, and gives the whole overlay one node to
 * attach, find and remove.
 *
 * Only the handle and the settings panel take pointer events. The text stays
 * transparent to them so clicking the picture plays and pauses the video the
 * way it does everywhere else on YouTube.
 */
export function createSubtitleOverlay(deps: SubtitleOverlayDeps): SubtitleOverlay {
  let host: HTMLElement | null = null;
  let shadow: ShadowRoot | null = null;
  let block: HTMLElement | null = null;
  let handle: HTMLElement | null = null;
  let gear: HTMLElement | null = null;
  let panel: HTMLElement | null = null;
  let originalEl: HTMLElement | null = null;
  let translationEl: HTMLElement | null = null;

  let offsetPct = clampSubtitleOffset(deps.getOffsetPct());
  let dragStartY = 0;
  let dragStartPct = 0;
  let dragging = false;
  let moved = false;
  let panelOpen = false;

  function player(): HTMLElement | null {
    return document.querySelector<HTMLElement>(PLAYER_SEL);
  }

  function hideNativeCaptions(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `${NATIVE_CAPTIONS_SEL} { display: none !important; }`;
    document.head.appendChild(style);
  }

  function showNativeCaptions(): void {
    document.getElementById(STYLE_ID)?.remove();
  }

  function mount(): boolean {
    const target = player();
    if (!target) return false;
    if (host && host.parentElement === target) return true;

    host?.remove();
    host = document.createElement('div');
    host.className = HOST_CLASS;
    host.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:25;';
    // The block is positioned against the player, which needs to be a
    // containing block for that to mean anything.
    if (getComputedStyle(target).position === 'static') target.style.position = 'relative';

    shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = SHADOW_CSS;
    shadow.appendChild(style);

    block = document.createElement('div');
    block.className = 'block';

    panel = buildPanel();
    handle = document.createElement('div');
    handle.className = 'handle';
    handle.title = deps.strings.dragHint;
    handle.addEventListener('pointerdown', onPointerDown);
    handle.addEventListener('click', swallow);
    handle.addEventListener('dblclick', swallow);

    gear = document.createElement('button');
    gear.setAttribute('type', 'button');
    gear.className = 'gear';
    gear.title = deps.strings.settings;
    gear.setAttribute('aria-label', deps.strings.settings);
    gear.innerHTML = GEAR_SVG; // static markup, no interpolation
    gear.addEventListener('pointerdown', (e) => e.stopPropagation());
    gear.addEventListener('click', (e) => {
      swallow(e);
      panelOpen = !panelOpen;
      renderPanel();
    });

    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.append(handle, gear);

    originalEl = document.createElement('div');
    originalEl.className = 'line bt-yt-line-original';
    translationEl = document.createElement('div');
    translationEl.className = 'line bt-yt-line-translation';

    block.append(panel, bar, originalEl, translationEl);
    shadow.appendChild(block);
    target.appendChild(host);
    renderPanel();
    return true;
  }

  // ---- settings panel -------------------------------------------------------

  function buildPanel(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'panel';
    // Everything in the panel is a control; none of it should reach the player.
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    el.addEventListener('click', (e) => e.stopPropagation());
    return el;
  }

  function stepper(
    label: string,
    value: string,
    onStep: (direction: -1 | 1) => void,
  ): HTMLElement {
    const row = document.createElement('div');
    row.className = 'row';
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = label;
    const controls = document.createElement('div');
    controls.className = 'stepper';
    for (const direction of [-1, 1] as const) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = direction === -1 ? '−' : '+';
      button.addEventListener('click', () => onStep(direction));
      if (direction === -1) controls.appendChild(button);
      else {
        const readout = document.createElement('span');
        readout.className = 'value';
        readout.textContent = value;
        controls.append(readout, button);
      }
    }
    row.append(name, controls);
    return row;
  }

  function renderPanel(): void {
    if (!panel) return;
    panel.style.display = panelOpen ? 'block' : 'none';
    if (!panelOpen) return;

    const current = deps.getAppearance();
    panel.textContent = '';

    panel.appendChild(stepper(
      deps.strings.fontScale,
      `${current.fontScale}%`,
      (direction) => applyAppearance({
        ...current,
        fontScale: clampSubtitleFontScale(current.fontScale + direction * FONT_SCALE_STEP),
      }),
    ));
    panel.appendChild(stepper(
      deps.strings.backgroundOpacity,
      `${current.backgroundOpacity}%`,
      (direction) => applyAppearance({
        ...current,
        backgroundOpacity: clampSubtitleBackgroundOpacity(
          current.backgroundOpacity + direction * OPACITY_STEP,
        ),
      }),
    ));

    const toggleRow = document.createElement('label');
    toggleRow.className = 'row toggle';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = current.translationOnly;
    checkbox.addEventListener('change', () => {
      applyAppearance({ ...current, translationOnly: checkbox.checked });
    });
    const toggleName = document.createElement('span');
    toggleName.className = 'name';
    toggleName.textContent = deps.strings.translationOnly;
    toggleRow.append(checkbox, toggleName);
    panel.appendChild(toggleRow);

    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'reset';
    reset.textContent = deps.strings.resetPosition;
    reset.addEventListener('click', () => {
      offsetPct = DEFAULT_SUBTITLE_OFFSET_PCT;
      deps.onOffsetChange(offsetPct);
      applyLayout();
    });
    panel.appendChild(reset);
  }

  function applyAppearance(next: SubtitleAppearance): void {
    deps.onAppearanceChange(next);
    renderPanel();
    refresh();
  }

  // ---- dragging -------------------------------------------------------------

  function swallow(e: Event): void {
    e.stopPropagation();
    e.preventDefault();
  }

  /**
   * The handle sits over the player, so every event it sees would otherwise
   * also reach YouTube: a press-move-release over the picture reads as a click
   * to the player, which toggles playback, and over an end screen or info card
   * it can navigate to another video — which tears the whole translation down.
   * Every stage of the gesture therefore stops propagating.
   */
  function onPointerDown(e: PointerEvent): void {
    if (!handle) return;
    e.stopPropagation();
    e.preventDefault();
    dragging = true;
    moved = false;
    dragStartY = e.clientY;
    dragStartPct = offsetPct;
    handle.dataset.dragging = 'true';
    // Listen on the window, not the handle: refresh() may rebuild the block
    // while a drag is in flight, and listeners bound to it would go with it,
    // leaving the drag stuck.
    window.addEventListener('pointermove', onPointerMove, true);
    window.addEventListener('pointerup', onPointerUp, true);
    window.addEventListener('pointercancel', onPointerUp, true);
  }

  function onPointerMove(e: PointerEvent): void {
    if (!dragging) return;
    e.stopPropagation();
    const target = player();
    if (!target || target.clientHeight === 0) return;
    if (Math.abs(e.clientY - dragStartY) > CLICK_SLOP) moved = true;
    // Dragging up must raise the block, so the delta is inverted: the offset is
    // measured from the bottom edge.
    const deltaPct = (dragStartY - e.clientY) / target.clientHeight;
    offsetPct = clampSubtitleOffset(dragStartPct + deltaPct);
    applyLayout();
  }

  function onPointerUp(e: PointerEvent): void {
    if (!dragging) return;
    e.stopPropagation();
    dragging = false;
    if (handle) handle.dataset.dragging = 'false';
    window.removeEventListener('pointermove', onPointerMove, true);
    window.removeEventListener('pointerup', onPointerUp, true);
    window.removeEventListener('pointercancel', onPointerUp, true);
    // A press that never moved is not a reposition; don't write it back.
    if (moved) deps.onOffsetChange(offsetPct);
  }

  // ---- layout ---------------------------------------------------------------

  /** Extra lift, as a fraction of player height, so the control bar can't cover
   *  the subtitles while it is on screen. */
  function controlsOffsetPct(target: HTMLElement): number {
    if (target.classList.contains(AUTOHIDE_CLASS)) return 0;
    if (target.clientHeight === 0) return 0;
    // No control bar found means we can't measure one; guessing a height would
    // shift the subtitles for no reason, so leave them where the viewer put them.
    const bar = target.querySelector<HTMLElement>(CONTROLS_SEL);
    if (!bar) return 0;
    const height = bar.getBoundingClientRect().height || FALLBACK_CONTROLS_HEIGHT;
    return height / target.clientHeight;
  }

  /** Position and text size both track the player, so this survives resizing,
   *  theater mode and fullscreen without any mode-specific handling. */
  function applyLayout(): void {
    const target = player();
    if (!target || !block) return;
    const bottom = offsetPct + controlsOffsetPct(target);
    block.style.bottom = `${Math.round(bottom * 10000) / 100}%`;

    const { fontScale } = deps.getAppearance();
    const auto = Math.min(Math.max(target.clientHeight * 0.035, 13), 40);
    block.style.fontSize = `${Math.round(auto * (fontScale / 100))}px`;
  }

  function setText(el: HTMLElement | null, text: string): void {
    if (!el) return;
    if (el.textContent !== text) el.textContent = text;
    el.style.display = text ? 'block' : 'none';
  }

  function refresh(): void {
    if (!mount()) return;
    const lines = deps.getLines();
    const { backgroundOpacity, translationOnly } = deps.getAppearance();
    const plate = `rgba(8,8,8,${clampSubtitleBackgroundOpacity(backgroundOpacity) / 100})`;
    if (originalEl) originalEl.style.background = plate;
    if (translationEl) translationEl.style.background = plate;

    if (!lines) {
      setText(originalEl, '');
      setText(translationEl, '');
      if (block) block.dataset.idle = panelOpen ? 'false' : 'true';
      applyLayout();
      return;
    }
    if (block) block.dataset.idle = 'false';

    setText(originalEl, translationOnly ? '' : lines.original);
    // A cue whose translation failed shows the original alone rather than a
    // placeholder that will never resolve.
    const translation = lines.translation ?? (lines.failed ? '' : deps.strings.placeholder);
    setText(translationEl, translation || (translationOnly ? lines.original : ''));
    if (translationEl) {
      translationEl.dataset.btPlaceholder = lines.translation ? 'false' : 'true';
    }
    applyLayout();
  }

  function start(): void {
    offsetPct = clampSubtitleOffset(deps.getOffsetPct());
    hideNativeCaptions();
    refresh();
  }

  function teardown(): void {
    showNativeCaptions();
    window.removeEventListener('pointermove', onPointerMove, true);
    window.removeEventListener('pointerup', onPointerUp, true);
    window.removeEventListener('pointercancel', onPointerUp, true);
    dragging = false;
    panelOpen = false;
    host?.remove();
    host = null;
    shadow = null;
    block = null;
    handle = null;
    gear = null;
    panel = null;
    originalEl = null;
    translationEl = null;
  }

  return { refresh, start, teardown };
}

/** Static, so it can't carry anything from the page or the user. */
const GEAR_SVG =
  '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="3"></circle>' +
  '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 ' +
  '1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 ' +
  '1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 ' +
  '4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 ' +
  '0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 ' +
  '1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';

/**
 * Styles for the shadow root. Self-contained by definition: nothing here can be
 * reached by YouTube's stylesheets, and nothing here escapes onto the page.
 */
const SHADOW_CSS = `
:host { all: initial; }
* { box-sizing: border-box; }
.block {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  max-width: 92%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  pointer-events: none;
  font-family: "YouTube Noto", Roboto, Arial, sans-serif;
}
.bar {
  display: flex;
  align-items: center;
  gap: 6px;
  pointer-events: auto;
  opacity: 0.35;
  transition: opacity 150ms ease;
}
.bar:hover, .block[data-idle="false"] .bar:hover { opacity: 1; }
.block[data-idle="true"] .bar { opacity: 0.12; }
.handle {
  width: 34px;
  height: 10px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.55);
  cursor: grab;
  touch-action: none;
  flex: none;
}
.handle[data-dragging="true"] { cursor: grabbing; background: #fff; }
.gear {
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: rgba(8, 8, 8, 0.6);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.gear:hover { background: rgba(8, 8, 8, 0.85); }
.line {
  color: #fff;
  padding: 2px 8px;
  border-radius: 3px;
  text-align: center;
  line-height: 1.3;
  white-space: pre-wrap;
  pointer-events: none;
}
.panel {
  pointer-events: auto;
  margin-bottom: 6px;
  min-width: 200px;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(16, 16, 16, 0.94);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-size: 12px;
  line-height: 1.4;
  display: none;
}
.panel .row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 3px 0;
}
.panel .name { color: rgba(255, 255, 255, 0.75); }
.panel .stepper { display: flex; align-items: center; gap: 4px; }
.panel .stepper button {
  width: 20px;
  height: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background: transparent;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  padding: 0;
}
.panel .stepper button:hover { background: rgba(255, 255, 255, 0.12); }
.panel .value { min-width: 38px; text-align: center; font-variant-numeric: tabular-nums; }
.panel .toggle { cursor: pointer; justify-content: flex-start; gap: 8px; }
.panel .reset {
  margin-top: 6px;
  width: 100%;
  padding: 4px 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background: transparent;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
}
.panel .reset:hover { background: rgba(255, 255, 255, 0.12); }
`;
