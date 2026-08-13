import { clampSubtitleOffset } from '~/core/subtitles/layout';

const PLAYER_SEL = '#movie_player';
const NATIVE_CAPTIONS_SEL = '.ytp-caption-window-container';
const CONTROLS_SEL = '.ytp-chrome-bottom';
/** YouTube adds this class to the player while the control bar is hidden. */
const AUTOHIDE_CLASS = 'ytp-autohide';
const FALLBACK_CONTROLS_HEIGHT = 48;

const ROOT_CLASS = 'bt-yt-subs';
const STYLE_ID = 'bt-yt-subs-style';

/** Movement under this many pixels is a press, not a reposition. */
const CLICK_SLOP = 3;

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

export interface SubtitleOverlayDeps {
  /** The lines to show right now, or null when no cue is active. */
  getLines: () => SubtitleLines | null;
  /** Shown in place of the translation while it is still being produced. */
  placeholder: string;
  getOffsetPct: () => number;
  /** Called once per drag, when the pointer is released. */
  onOffsetChange: (pct: number) => void;
  getAppearance: () => SubtitleAppearance;
  /** Tooltip for the drag handle. */
  dragHint: string;
}

export interface SubtitleOverlay {
  refresh: () => void;
  start: () => void;
  teardown: () => void;
}

/**
 * Draws both subtitle lines ourselves, in a block anchored to the player, and
 * hides YouTube's own caption container while active.
 *
 * The previous approach appended a line inside YouTube's caption DOM, which
 * ruled out auto-generated captions entirely: those render as a rolling
 * multi-line window that reflows on every word and covered the injected line.
 * Owning the block instead means the layout is ours — the same code path works
 * for manual and ASR tracks, the viewer can drag it out of the way, and nothing
 * depends on the internals of YouTube's caption markup.
 *
 * Only the drag handle takes pointer events. The text itself stays transparent
 * to them so that clicking the picture still plays and pauses the video the way
 * it does everywhere else on YouTube.
 */
export function createSubtitleOverlay(deps: SubtitleOverlayDeps): SubtitleOverlay {
  let root: HTMLElement | null = null;
  let block: HTMLElement | null = null;
  let handle: HTMLElement | null = null;
  let originalEl: HTMLElement | null = null;
  let translationEl: HTMLElement | null = null;
  let offsetPct = clampSubtitleOffset(deps.getOffsetPct());
  let dragStartY = 0;
  let dragStartPct = 0;
  let dragging = false;
  let moved = false;

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
    const host = player();
    if (!host) return false;
    if (root && root.parentElement === host) return true;

    root?.remove();
    root = document.createElement('div');
    root.className = ROOT_CLASS;
    root.style.cssText =
      'position:absolute;inset:0;pointer-events:none;z-index:25;' +
      'display:flex;justify-content:center;';

    block = document.createElement('div');
    block.style.cssText =
      'position:absolute;max-width:92%;display:flex;flex-direction:column;' +
      'align-items:center;gap:2px;pointer-events:none;';

    handle = document.createElement('div');
    handle.className = 'bt-yt-subs-handle';
    handle.title = deps.dragHint;
    handle.style.cssText =
      'width:34px;height:10px;border-radius:5px;background:rgba(255,255,255,0.45);' +
      'pointer-events:auto;cursor:grab;opacity:0.35;transition:opacity 150ms ease;' +
      'touch-action:none;flex:none;';
    handle.addEventListener('pointerdown', onPointerDown);
    handle.addEventListener('pointerenter', () => { if (handle) handle.style.opacity = '1'; });
    handle.addEventListener('pointerleave', () => { if (handle && !dragging) handle.style.opacity = '0.35'; });
    handle.addEventListener('click', swallow);
    handle.addEventListener('dblclick', swallow);

    originalEl = lineElement('bt-yt-line-original');
    translationEl = lineElement('bt-yt-line-translation');
    block.append(handle, originalEl, translationEl);
    root.appendChild(block);
    host.appendChild(root);
    return true;
  }

  function lineElement(className: string): HTMLElement {
    const el = document.createElement('div');
    el.className = className;
    el.style.cssText =
      'color:#fff;padding:2px 8px;border-radius:3px;pointer-events:none;' +
      'text-align:center;line-height:1.3;white-space:pre-wrap;' +
      'font-family:"YouTube Noto",Roboto,Arial,sans-serif;';
    return el;
  }

  function swallow(e: Event): void {
    e.stopPropagation();
    e.preventDefault();
  }

  /**
   * The handle sits inside the player, so every event it sees would otherwise
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
    handle.style.cursor = 'grabbing';
    handle.style.opacity = '1';
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
    const host = player();
    if (!host || host.clientHeight === 0) return;
    if (Math.abs(e.clientY - dragStartY) > CLICK_SLOP) moved = true;
    // Dragging up must raise the block, so the delta is inverted: the offset is
    // measured from the bottom edge.
    const deltaPct = (dragStartY - e.clientY) / host.clientHeight;
    offsetPct = clampSubtitleOffset(dragStartPct + deltaPct);
    applyLayout();
  }

  function onPointerUp(e: PointerEvent): void {
    if (!dragging) return;
    e.stopPropagation();
    dragging = false;
    if (handle) {
      handle.style.cursor = 'grab';
      handle.style.opacity = '0.35';
    }
    window.removeEventListener('pointermove', onPointerMove, true);
    window.removeEventListener('pointerup', onPointerUp, true);
    window.removeEventListener('pointercancel', onPointerUp, true);
    // A press that never moved is not a reposition; don't write it back.
    if (moved) deps.onOffsetChange(offsetPct);
  }

  /** Extra lift, as a fraction of player height, so the control bar can't cover
   *  the subtitles while it is on screen. */
  function controlsOffsetPct(host: HTMLElement): number {
    if (host.classList.contains(AUTOHIDE_CLASS)) return 0;
    if (host.clientHeight === 0) return 0;
    // No control bar found means we can't measure one; guessing a height would
    // shift the subtitles for no reason, so leave them where the viewer put them.
    const bar = host.querySelector<HTMLElement>(CONTROLS_SEL);
    if (!bar) return 0;
    const height = bar.getBoundingClientRect().height || FALLBACK_CONTROLS_HEIGHT;
    return height / host.clientHeight;
  }

  /** Position and text size both track the player, so this survives resizing,
   *  theater mode and fullscreen without any mode-specific handling. */
  function applyLayout(): void {
    const host = player();
    if (!host || !block) return;
    const bottom = offsetPct + controlsOffsetPct(host);
    block.style.bottom = `${Math.round(bottom * 10000) / 100}%`;

    const { fontScale } = deps.getAppearance();
    const auto = Math.min(Math.max(host.clientHeight * 0.035, 13), 40);
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
    const plate = `rgba(8,8,8,${Math.min(100, Math.max(0, backgroundOpacity)) / 100})`;
    if (originalEl) originalEl.style.background = plate;
    if (translationEl) translationEl.style.background = plate;

    if (!lines) {
      setText(originalEl, '');
      setText(translationEl, '');
      if (handle) handle.style.opacity = dragging ? '1' : '0.15';
      return;
    }
    if (handle && !dragging) handle.style.opacity = '0.35';

    setText(originalEl, translationOnly ? '' : lines.original);
    // A cue whose translation failed shows the original alone rather than a
    // placeholder that will never resolve.
    const translation = lines.translation ?? (lines.failed ? '' : deps.placeholder);
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
    root?.remove();
    root = null;
    block = null;
    handle = null;
    originalEl = null;
    translationEl = null;
  }

  return { refresh, start, teardown };
}
