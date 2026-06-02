const CONTROLS_SEL = '.ytp-right-controls';
const BTN_CLASS = 'bt-yt-subs-button';

interface ToggleButton extends HTMLButtonElement {
  _btOnToggle?: () => void;
}

export interface SubsButtonDeps {
  titleOff: string;
  titleOn: string;
  onToggle: () => void;
}

export interface SubsButtonHandle {
  mounted: boolean;
  setActive: (active: boolean) => void;
  remove: () => void;
}

/**
 * Remove the subtitle button from the control bar. Used when a SPA navigation lands
 * on a video with no translatable (manual) caption track — the control bar persists
 * across navigations, so a button from the previous video would otherwise linger.
 */
export function removeSubsButton(): void {
  document.querySelector(`.${BTN_CLASS}`)?.remove();
}

export function mountSubsButton(deps: SubsButtonDeps): SubsButtonHandle {
  const controls = document.querySelector(CONTROLS_SEL);
  if (!controls) return { mounted: false, setActive: () => {}, remove: () => {} };

  const existing = controls.querySelector<ToggleButton>(`.${BTN_CLASS}`);
  const btn = (existing ?? document.createElement('button')) as ToggleButton;
  btn.type = 'button';
  btn.className = `ytp-button ${BTN_CLASS}`;
  btn.title = deps.titleOff;
  btn.setAttribute('aria-pressed', 'false');
  // BrowserTranslate "Languages" glyph as inline SVG. Uses currentColor so the
  // button's color drives it (white normally, accent blue when active), matching
  // YouTube's monochrome control-bar icons. Static string — no XSS surface.
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true">' +
    '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/>' +
    '<path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>';
  btn.style.cssText = [
    'display:inline-flex',
    'align-items:center',
    'justify-content:center',
    'width:48px',
    'height:100%',
    'vertical-align:top',
    'color:#fff',
    'opacity:0.9',
    'cursor:pointer',
  ].join(';');
  // Always point the (single) listener at the current handler, so a remount on
  // SPA navigation with a fresh onToggle is honored instead of the stale one.
  btn._btOnToggle = deps.onToggle;
  if (!existing) {
    btn.addEventListener('click', () => btn._btOnToggle?.());
    controls.insertBefore(btn, controls.firstChild);
  }

  return {
    mounted: true,
    setActive(active) {
      btn.title = active ? deps.titleOn : deps.titleOff;
      btn.setAttribute('aria-pressed', String(active));
      btn.style.color = active ? '#3ea6ff' : '#fff';
      btn.style.opacity = active ? '1' : '0.9';
    },
    remove() { btn.remove(); },
  };
}
