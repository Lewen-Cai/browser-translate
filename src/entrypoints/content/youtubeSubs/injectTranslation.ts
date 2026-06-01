const CONTAINER_SEL = '.ytp-caption-window-container';
const MARKER = 'bt-yt-translation';

export interface CaptionInjectorDeps {
  /** Resolve the translation for the caption text currently on screen. */
  getTranslation: (nativeText: string) => string | undefined;
  /** Shown under the caption while its translation is still being produced. */
  placeholder: string;
}

export interface CaptionInjector {
  refresh: () => void;
  start: () => void;
  teardown: () => void;
}

export function createCaptionInjector(deps: CaptionInjectorDeps): CaptionInjector {
  let observer: MutationObserver | null = null;

  function refresh(): void {
    const container = document.querySelector(CONTAINER_SEL);
    if (!container) return;

    // YouTube's own caption text lives in `.ytp-caption-segment` spans (never our
    // injected line). Concatenate them to know what's on screen right now.
    const segs = Array.from(document.querySelectorAll<HTMLElement>('.ytp-caption-segment'));
    const nativeText = segs.map((s) => s.textContent ?? '').join('').trim();

    const existing = document.querySelector<HTMLElement>(`.${MARKER}`);
    if (!nativeText) {
      // No caption on screen → nothing to attach to.
      existing?.remove();
      return;
    }

    // Match by the displayed text (aligns the translation to the exact line on
    // screen); fall back to the placeholder while the translation is in flight.
    const translation = deps.getTranslation(nativeText);
    const text = translation ?? deps.placeholder;

    // Match YouTube's caption font so the translation looks native.
    const segStyle = segs[0] ? getComputedStyle(segs[0]) : null;
    const fontSize = segStyle?.fontSize ?? '';
    const fontFamily = segStyle?.fontFamily ?? '';

    function applyFont(el: HTMLElement): void {
      if (fontSize) el.style.fontSize = fontSize;
      if (fontFamily) el.style.fontFamily = fontFamily;
    }

    const target =
      document.querySelector<HTMLElement>('.captions-text') ??
      document.querySelector<HTMLElement>('.caption-window') ??
      (container as HTMLElement);

    if (existing && existing.parentElement === target) {
      if (existing.textContent !== text) existing.textContent = text;
      applyFont(existing);
      existing.dataset.btPlaceholder = translation ? 'false' : 'true';
      return;
    }

    existing?.remove();
    const line = document.createElement('div');
    line.className = MARKER;
    line.textContent = text;
    line.dataset.btPlaceholder = translation ? 'false' : 'true';
    line.style.cssText =
      'display:block;text-align:center;color:#fff;background:rgba(8,8,8,0.85);' +
      'padding:1px 6px;border-radius:2px;margin-top:2px;width:fit-content;max-width:100%;' +
      'margin-left:auto;margin-right:auto;line-height:1.3;white-space:pre-wrap;' +
      'pointer-events:none;position:relative;';
    applyFont(line);
    if (!line.style.fontSize) line.style.fontSize = 'inherit';
    target.appendChild(line);
  }

  function start(): void {
    observer = new MutationObserver(() => refresh());
    observer.observe(document.body, { childList: true, subtree: true });
    refresh();
  }

  function teardown(): void {
    observer?.disconnect();
    observer = null;
    document.querySelectorAll(`.${MARKER}`).forEach((n) => n.remove());
  }

  return { refresh, start, teardown };
}
