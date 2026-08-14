import type { SiteButtonStyle } from './site';

const BTN_CLASS = 'bt-subs-button';

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
 * Remove the subtitle button from the control bar. Used when a navigation lands
 * on media with no translatable caption track — a control bar often persists
 * across navigation, so a button from the previous video would otherwise linger.
 */
export function removeSubsButton(): void {
  document.querySelector(`.${BTN_CLASS}`)?.remove();
}

/**
 * Put the toggle in the site's own control bar.
 *
 * It borrows the site's button class so it inherits that bar's sizing, spacing
 * and hover, and takes its colours from the same place: a control bar's idea of
 * "this control is on" belongs to the site, and ours standing out from its
 * neighbours would read as a fault rather than as a feature.
 */
export function mountSubsButton(style: SiteButtonStyle, deps: SubsButtonDeps): SubsButtonHandle {
  const controls = document.querySelector(style.container);
  if (!controls) return { mounted: false, setActive: () => {}, remove: () => {} };

  const idle = style.idleColor ?? '#fff';
  const active = style.activeColor ?? '#3ea6ff';

  const existing = controls.querySelector<ToggleButton>(`.${BTN_CLASS}`);
  const btn = (existing ?? document.createElement('button')) as ToggleButton;
  btn.type = 'button';
  btn.className = style.className ? `${style.className} ${BTN_CLASS}` : BTN_CLASS;
  btn.title = deps.titleOff;
  btn.setAttribute('aria-pressed', 'false');
  // BrowserTranslate "Languages" glyph as inline SVG. Uses currentColor so the
  // button's color drives it, matching the monochrome icons a video control bar
  // tends to use. Static string — no XSS surface.
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
    `width:${style.width ?? '48px'}`,
    'height:100%',
    'vertical-align:top',
    `color:${idle}`,
    'opacity:0.9',
    'cursor:pointer',
  ].join(';');
  // Always point the (single) listener at the current handler, so a remount on
  // navigation with a fresh onToggle is honored instead of the stale one.
  btn._btOnToggle = deps.onToggle;
  if (!existing) {
    btn.addEventListener('click', () => btn._btOnToggle?.());
    if (style.place === 'end') controls.appendChild(btn);
    else controls.insertBefore(btn, controls.firstChild);
  }

  return {
    mounted: true,
    setActive(isActive) {
      btn.title = isActive ? deps.titleOn : deps.titleOff;
      btn.setAttribute('aria-pressed', String(isActive));
      btn.style.color = isActive ? active : idle;
      btn.style.opacity = isActive ? '1' : '0.9';
    },
    remove() { btn.remove(); },
  };
}
