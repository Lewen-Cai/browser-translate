import {
  MAX_SUBTITLE_POSITION_PCT,
  SUBTITLE_FONT_FAMILIES,
  showsOriginal,
  showsTranslation,
  type SubtitlePosition,
  type SubtitleStyle,
  type SubtitleTextStyle,
} from '~/core/subtitles/style';
import { SUBTITLES_CSS } from './subtitlesCss';
import { createSettingsPanel, type SettingsPanel, type SubtitlePanelStrings } from './settingsPanel';
import type { SiteSelectors } from './site';

const HOST_CLASS = 'bt-subs';
const STYLE_ID = 'bt-subs-style';

/** Movement under this many pixels is a press, not a reposition. */
const CLICK_SLOP = 3;
/** How long after a drag a click is still assumed to belong to that drag. */
const CLICK_SUPPRESS_MS = 400;

/** Text size as a fraction of the player's height, floored and capped so a
 *  thumbnail-sized player stays legible and a 4K one stays out of the way. */
const FONT_RATIO = 0.035;
const MIN_FONT_PX = 13;
const MAX_FONT_PX = 44;

/** Gap between the panel and the control bar / the bottom of the picture. */
const PANEL_GAP_OVER_CONTROLS = 18;
const PANEL_GAP_BARE = 22;

export interface SubtitleLines {
  original: string;
  /** null while the translation for this cue is still in flight. */
  translation: string | null;
  /** true once the translation is known not to be coming — show the original alone. */
  failed?: boolean;
}

export interface SubtitleUiStrings extends SubtitlePanelStrings {
  /** Shown in place of the translation while it is still being produced. */
  placeholder: string;
  dragHint: string;
}

export interface SubtitlesUiDeps {
  /** Where this site's player is, and what the subtitles have to dodge. */
  selectors: SiteSelectors;
  /** The lines to show right now, or null when no cue is active. */
  getLines: () => SubtitleLines | null;
  /** The language the translated line is in, so the block can declare it. */
  getTargetLang: () => string;
  strings: SubtitleUiStrings;
  getPosition: () => SubtitlePosition;
  /** Called once per drag, when the pointer is released. */
  onPositionChange: (next: SubtitlePosition) => void;
  getStyle: () => SubtitleStyle;
  onStyleChange: (next: SubtitleStyle) => void;
  isActive: () => boolean;
  onActiveChange: (on: boolean) => void;
}

export interface SubtitlesUi {
  /** Draw the current cue. Cheap enough to call every frame. */
  refresh: () => void;
  setActive: (on: boolean) => void;
  togglePanel: () => void;
  teardown: () => void;
}

function isTextStyleEqual(a: SubtitleTextStyle, b: SubtitleTextStyle): boolean {
  return a.fontScale === b.fontScale && a.color === b.color
    && a.fontFamily === b.fontFamily && a.fontWeight === b.fontWeight;
}

function isStyleEqual(a: SubtitleStyle, b: SubtitleStyle): boolean {
  return a.displayMode === b.displayMode && a.translationPosition === b.translationPosition
    && a.backgroundOpacity === b.backgroundOpacity
    && isTextStyleEqual(a.main, b.main) && isTextStyleEqual(a.translation, b.translation);
}

/**
 * The in-player subtitle UI: our own two lines drawn over the picture, a grip to
 * move them, and the settings menu — all inside one shadow root attached to the
 * player.
 *
 * A shadow root rather than plain nodes because YouTube is one of the most
 * heavily scripted and styled pages on the web, and it rebuilds parts of the
 * player as the viewer resizes, goes fullscreen or moves through the video. The
 * shadow boundary keeps YouTube's CSS off our elements and ours off theirs, and
 * gives the whole overlay a single node to attach, find and remove.
 *
 * Everything inside is sized in `em` against a root font size taken from the
 * player's height, so the same numbers hold from a small embedded player up to
 * fullscreen without any mode-specific handling.
 */
export function createSubtitlesUi(deps: SubtitlesUiDeps): SubtitlesUi {
  let host: HTMLElement | null = null;
  let windowEl: HTMLElement | null = null;
  let group: HTMLElement | null = null;
  let grip: HTMLElement | null = null;
  let plate: HTMLElement | null = null;
  let originalEl: HTMLElement | null = null;
  let translationEl: HTMLElement | null = null;
  let panel: SettingsPanel | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let classObserver: MutationObserver | null = null;

  let position = deps.getPosition();
  let appliedStyle: SubtitleStyle | null = null;
  let appliedPanelOffset = -1;
  let active = false;

  let dragging = false;
  let moved = false;
  let suppressClickUntil = 0;
  let dragStartY = 0;
  let dragStartTop = 0;
  let dragBlockHeight = 0;

  function player(): HTMLElement | null {
    return document.querySelector<HTMLElement>(deps.selectors.player);
  }

  function controlsVisible(target: HTMLElement): boolean {
    // A site with no autohide class never hides its controls as far as we can
    // tell, so the subtitles stay clear of them the whole time — which is the
    // safe way to be wrong.
    const cls = deps.selectors.autohideClass;
    return !cls || !target.classList.contains(cls);
  }

  function controlsHeightPx(target: HTMLElement): number {
    // No control bar found means we can't measure one; guessing a height would
    // shift the subtitles for no reason, so treat it as zero.
    const sel = deps.selectors.controls;
    if (!sel) return 0;
    return target.querySelector<HTMLElement>(sel)?.getBoundingClientRect().height ?? 0;
  }

  /** Extra lift, as a percentage of player height, so the control bar can't
   *  cover the subtitles while it is on screen. */
  function controlsOffsetPct(target: HTMLElement): number {
    const height = target.clientHeight;
    if (!height || !controlsVisible(target)) return 0;
    return (controlsHeightPx(target) / height) * 100;
  }

  // ---- mounting -------------------------------------------------------------

  function mount(): boolean {
    const target = player();
    if (!target) return false;
    if (host && host.parentElement === target) return true;

    teardownDom();
    // The overlay is positioned against the player, which has to be a containing
    // block for that to mean anything.
    if (getComputedStyle(target).position === 'static') target.style.position = 'relative';

    host = document.createElement('div');
    host.className = HOST_CLASS;
    host.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:9999;';
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = SUBTITLES_CSS;
    shadow.appendChild(style);

    windowEl = document.createElement('div');
    windowEl.className = 'window';
    // Declaring the language is what makes the CJK fallback correct: our own
    // serif stack is chosen from it, and the browser resolves the generic
    // families from it too, so Japanese gets a Japanese face rather than
    // whichever Chinese font happened to contain the glyph.
    windowEl.lang = deps.getTargetLang();

    group = document.createElement('div');
    group.className = 'group';
    group.dataset.dragging = 'false';
    group.dataset.hidden = String(!active);

    grip = document.createElement('div');
    grip.className = 'grip';
    grip.title = deps.strings.dragHint;
    grip.dataset.dragging = 'false';
    const gripBar = document.createElement('span');
    gripBar.className = 'grip-bar';
    grip.appendChild(gripBar);
    grip.addEventListener('pointerdown', onPointerDown);
    grip.addEventListener('click', swallow);
    grip.addEventListener('dblclick', swallow);

    plate = document.createElement('div');
    plate.className = 'plate';
    originalEl = document.createElement('div');
    originalEl.className = 'line line-main';
    translationEl = document.createElement('div');
    translationEl.className = 'line line-translation';
    plate.append(originalEl, translationEl);

    group.append(grip, plate);
    windowEl.appendChild(group);

    panel = createSettingsPanel({
      strings: deps.strings,
      isActive: deps.isActive,
      onActiveChange: deps.onActiveChange,
      getStyle: deps.getStyle,
      onStyleChange: (next) => { deps.onStyleChange(next); appliedStyle = null; refresh(); },
      onResetPosition: () => {
        position = { percent: 6, anchor: 'bottom' };
        deps.onPositionChange(position);
        applyLayout();
      },
    });
    windowEl.appendChild(panel.el);
    shadow.appendChild(windowEl);
    target.appendChild(host);

    // The control bar comes and goes by class, and the player is resized by
    // theater mode, fullscreen and the window itself. Watching both beats
    // re-measuring on every animation frame.
    window.addEventListener('click', onWindowClick, true);
    resizeObserver = new ResizeObserver(() => applyLayout());
    resizeObserver.observe(target);
    classObserver = new MutationObserver(() => applyLayout());
    classObserver.observe(target, { attributes: true, attributeFilter: ['class'], subtree: true });

    appliedStyle = null;
    appliedPanelOffset = -1;
    applyLayout();
    return true;
  }

  function hideNativeCaptions(): void {
    // A site whose captions we cannot name gets left alone: ours is drawn over
    // the picture either way, and hiding the wrong element would take part of
    // the player with it.
    const sel = deps.selectors.nativeCaptions;
    if (!sel || document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `${sel} { display: none !important; }`;
    document.head.appendChild(style);
  }

  function showNativeCaptions(): void {
    document.getElementById(STYLE_ID)?.remove();
  }

  // ---- dragging -------------------------------------------------------------

  function swallow(e: Event): void {
    e.stopPropagation();
    e.preventDefault();
  }

  /**
   * The grip sits over the player, so every event it sees would otherwise also
   * reach YouTube: a press-move-release over the picture reads as a click to the
   * player, which toggles playback, and over an end screen or info card it can
   * navigate to another video — which tears the whole translation down. Every
   * stage of the gesture therefore stops propagating.
   */
  function onPointerDown(e: PointerEvent): void {
    const target = player();
    if (!target || !group) return;
    e.stopPropagation();
    e.preventDefault();
    const playerRect = target.getBoundingClientRect();
    const groupRect = group.getBoundingClientRect();
    dragging = true;
    moved = false;
    dragStartY = e.clientY;
    dragStartTop = groupRect.top - playerRect.top;
    dragBlockHeight = groupRect.height;
    group.dataset.dragging = 'true';
    if (grip) grip.dataset.dragging = 'true';
    // Capture the pointer so the whole gesture belongs to the grip. Without it
    // the block stops tracking the pointer as soon as it hits a clamp, the
    // release lands on the picture instead, and the browser follows it with a
    // click on the nearest common ancestor — the player. On YouTube that click
    // pauses the video, and over an end screen or info card it navigates to
    // another video, taking the whole translation with it.
    grip?.setPointerCapture?.(e.pointerId);
    // Listen on the window, not the grip: the overlay may be rebuilt while a
    // drag is in flight, and listeners bound to it would go with it, leaving the
    // gesture stuck.
    window.addEventListener('pointermove', onPointerMove, true);
    window.addEventListener('pointerup', onPointerUp, true);
    window.addEventListener('pointercancel', onPointerUp, true);
  }

  function onPointerMove(e: PointerEvent): void {
    if (!dragging) return;
    e.stopPropagation();
    const target = player();
    const height = target?.clientHeight ?? 0;
    if (!target || !height) return;
    if (Math.abs(e.clientY - dragStartY) > CLICK_SLOP) moved = true;

    const top = Math.min(
      Math.max(dragStartTop + (e.clientY - dragStartY), 0),
      Math.max(height - dragBlockHeight, 0),
    );
    // Which edge the block belongs to is decided by which half of the picture
    // its middle has landed in. Anchoring to the near edge is what keeps a
    // subtitle dragged to the top of the frame at the top when the player grows.
    if (top + dragBlockHeight / 2 < height / 2) {
      position = { anchor: 'top', percent: clampPct((top / height) * 100) };
    } else {
      const bottom = height - (top + dragBlockHeight);
      // The rendered offset adds the control-bar lift back on, so take it out
      // here or the block would run away from the pointer while the bar is up.
      position = {
        anchor: 'bottom',
        percent: clampPct((bottom / height) * 100 - controlsOffsetPct(target)),
      };
    }
    applyLayout();
  }

  function onPointerUp(e: PointerEvent): void {
    if (!dragging) return;
    e.stopPropagation();
    dragging = false;
    if (group) group.dataset.dragging = 'false';
    if (grip) grip.dataset.dragging = 'false';
    grip?.releasePointerCapture?.(e.pointerId);
    window.removeEventListener('pointermove', onPointerMove, true);
    window.removeEventListener('pointerup', onPointerUp, true);
    window.removeEventListener('pointercancel', onPointerUp, true);
    // A press that never moved is not a reposition; don't write it back.
    if (!moved) return;
    deps.onPositionChange(position);
    // Belt and braces on top of the pointer capture: swallow the one click the
    // release is about to generate, whatever it ends up aimed at.
    suppressClickUntil = performance.now() + CLICK_SUPPRESS_MS;
  }

  /**
   * Eats the click that closes out a drag. Registered for the overlay's whole
   * life and gated on a timestamp rather than added and removed around each
   * gesture, because a listener added on release races the click it exists to
   * catch and one removed on a timer can outlive it.
   */
  function onWindowClick(e: MouseEvent): void {
    if (performance.now() > suppressClickUntil) return;
    suppressClickUntil = 0;
    e.stopPropagation();
    e.preventDefault();
  }

  function clampPct(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.min(MAX_SUBTITLE_POSITION_PCT, Math.max(0, value));
  }

  // ---- layout and style -----------------------------------------------------

  /**
   * Cheap enough to call every frame: it recomputes freely but only touches the
   * DOM when a value actually changed. That means the animation loop, the
   * observers and the drag can all just call it, and none of them has to know
   * what the others already did.
   */
  function applyLayout(): void {
    const target = player();
    if (!target || !group || !windowEl || !panel) return;
    const height = target.clientHeight;
    if (!height) return;

    const top = position.anchor === 'top' ? `${round2(position.percent)}%` : 'auto';
    const bottom = position.anchor === 'top'
      ? 'auto'
      : `${round2(position.percent + controlsOffsetPct(target))}%`;
    if (group.style.top !== top) group.style.top = top;
    if (group.style.bottom !== bottom) group.style.bottom = bottom;

    const size = Math.min(Math.max(height * FONT_RATIO, MIN_FONT_PX), MAX_FONT_PX);
    const fontSize = `${Math.round(size)}px`;
    if (windowEl.style.fontSize !== fontSize) windowEl.style.fontSize = fontSize;

    const offset = controlsVisible(target)
      ? controlsHeightPx(target) + PANEL_GAP_OVER_CONTROLS
      : PANEL_GAP_BARE;
    if (offset !== appliedPanelOffset) {
      appliedPanelOffset = offset;
      panel.setBottomOffset(offset);
    }
  }

  function applyTextStyle(el: HTMLElement | null, text: SubtitleTextStyle): void {
    if (!el) return;
    el.style.fontSize = `${text.fontScale / 100}em`;
    el.style.color = text.color;
    el.style.fontFamily = SUBTITLE_FONT_FAMILIES[text.fontFamily];
    el.style.fontWeight = String(text.fontWeight);
  }

  function applyStyle(style: SubtitleStyle): void {
    if (appliedStyle && isStyleEqual(appliedStyle, style)) return;
    appliedStyle = style;
    if (plate) plate.style.background = `rgba(0, 0, 0, ${style.backgroundOpacity / 100})`;
    applyTextStyle(originalEl, style.main);
    applyTextStyle(translationEl, style.translation);
    // Flex order rather than moving nodes, so the DOM stays put while the
    // reader flips the two lines around.
    const translationFirst = style.translationPosition === 'above';
    if (originalEl) originalEl.style.order = translationFirst ? '2' : '1';
    if (translationEl) translationEl.style.order = translationFirst ? '1' : '2';
  }

  function setText(el: HTMLElement | null, text: string): void {
    if (!el) return;
    if (el.textContent !== text) el.textContent = text;
    el.dataset.empty = text ? 'false' : 'true';
  }

  function refresh(): void {
    if (!mount()) return;
    // Pick up a position set from somewhere else — a reset from the menu, or
    // another tab — without stealing the block out from under a live drag.
    if (!dragging) {
      const stored = deps.getPosition();
      if (stored !== position) position = stored;
    }
    const targetLang = deps.getTargetLang();
    if (windowEl && windowEl.lang !== targetLang) windowEl.lang = targetLang;
    const style = deps.getStyle();
    applyStyle(style);
    applyLayout();
    if (group) group.dataset.hidden = String(!active);
    if (!active) return;

    const lines = deps.getLines();
    if (!lines) {
      setText(originalEl, '');
      setText(translationEl, '');
      if (plate) plate.dataset.empty = 'true';
      return;
    }
    if (plate) plate.dataset.empty = 'false';

    setText(originalEl, showsOriginal(style.displayMode) ? lines.original : '');
    // A cue whose translation failed shows the original alone rather than a
    // placeholder that will never resolve.
    const pending = lines.translation === null && !lines.failed;
    const translation = lines.translation ?? (pending ? deps.strings.placeholder : '');
    setText(
      translationEl,
      showsTranslation(style.displayMode)
        ? (translation || (style.displayMode === 'translationOnly' ? lines.original : ''))
        : '',
    );
    if (translationEl) translationEl.dataset.placeholder = String(pending);
  }

  function setActive(on: boolean): void {
    active = on;
    position = deps.getPosition();
    if (on) hideNativeCaptions();
    else showNativeCaptions();
    if (group) group.dataset.hidden = String(!on);
    refresh();
  }

  function togglePanel(): void {
    if (!mount()) return;
    panel?.toggle();
  }

  function teardownDom(): void {
    window.removeEventListener('click', onWindowClick, true);
    resizeObserver?.disconnect();
    classObserver?.disconnect();
    panel?.destroy();
    host?.remove();
    resizeObserver = null;
    classObserver = null;
    panel = null;
    host = null;
    windowEl = null;
    group = null;
    grip = null;
    plate = null;
    originalEl = null;
    translationEl = null;
    appliedStyle = null;
    appliedPanelOffset = -1;
  }

  function teardown(): void {
    showNativeCaptions();
    window.removeEventListener('pointermove', onPointerMove, true);
    window.removeEventListener('pointerup', onPointerUp, true);
    window.removeEventListener('pointercancel', onPointerUp, true);
    dragging = false;
    active = false;
    teardownDom();
  }

  return { refresh, setActive, togglePanel, teardown };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
