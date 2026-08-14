import type { SiteButtonStyle, SiteSelectors } from './site';

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
export function mountSubsButton(
  style: SiteButtonStyle,
  deps: SubsButtonDeps,
  selectors?: SiteSelectors,
): SubsButtonHandle {
  const controls = style.container ? document.querySelector(style.container) : null;
  const corner = !controls && style.fallback === 'player-corner' && selectors?.player
    ? document.querySelector(selectors.player)
    : null;
  if (corner) cornerFollowsControls(selectors!);
  const host = controls ?? corner;
  if (!host) return { mounted: false, setActive: () => {}, remove: () => {} };

  const idle = style.idleColor ?? '#fff';
  const active = style.activeColor ?? '#3ea6ff';
  /**
   * A button wearing the site's own class must not then fight it. The class is
   * what makes it the right size and colour for that bar; inline sizing and a
   * forced white on top is what left ours 26px tall and white in a row of 40px
   * black ones, and misaligned by the difference.
   */
  const borrowed = Boolean(style.className) && !corner;

  const existing = host.querySelector<ToggleButton>(`.${BTN_CLASS}`);
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
    'cursor:pointer',
    ...(style.width ? [`width:${style.width}`] : []),
    // Over the picture the button has to carry its own box and background, or a
    // white glyph lands on a white frame and disappears. In a bar it either
    // wears the site's class — and then the class decides everything — or, for
    // a bar with no class worth borrowing, our own plain sizing.
    ...(corner
      ? [
          'position:absolute', 'top:12px', 'right:12px', 'z-index:2147483000',
          `width:${style.width ?? '40px'}`, 'height:34px', 'border:none',
          'border-radius:8px', 'background:rgb(0 0 0 / 0.55)',
          'backdrop-filter:blur(4px)', 'opacity:1', `color:${idle}`,
        ]
      : borrowed
        ? (style.idleColor
            ? [`color:${style.idleColor}`]
            // No colour named means the bar's own is not knowable — and one bar
            // may be two: Canvas draws its controls dark over the page and
            // light in fullscreen. A white glyph with a dark edge reads on
            // both; picking either colour outright loses one of them, and a
            // shade between them is weak on each.
            : ['color:#fff', `filter:${OUTLINE}`])
        : [`width:${style.width ?? '48px'}`, 'height:100%', 'vertical-align:top',
           'opacity:0.9', `color:${idle}`]),
  ].join(';');
  // Always point the (single) listener at the current handler, so a remount on
  // navigation with a fresh onToggle is honored instead of the stale one.
  btn._btOnToggle = deps.onToggle;
  if (!existing) {
    btn.addEventListener('click', () => btn._btOnToggle?.());
    const anchor = !corner && style.before ? host.querySelector(style.before) : null;
    if (anchor) host.insertBefore(btn, anchor);
    else if (corner || style.place === 'end') host.appendChild(btn);
    else host.insertBefore(btn, host.firstChild);
  }

  return {
    mounted: true,
    setActive(isActive) {
      btn.title = isActive ? deps.titleOn : deps.titleOff;
      btn.setAttribute('aria-pressed', String(isActive));
      // An empty string hands the colour back to the site's class, which is
      // where a borrowed button's idle colour comes from.
      btn.style.color = isActive ? active : (borrowed && !style.idleColor ? '#fff' : idle);
      if (!corner && !borrowed) btn.style.opacity = isActive ? '1' : '0.9';
    },
    remove() { btn.remove(); },
  };
}

/**
 * A dark edge drawn around the glyph. Two shadows rather than one: the tight
 * pair carries the outline on a light bar, and the soft one keeps it from
 * disappearing into a bright patch of video behind a transparent bar.
 */
const OUTLINE = 'drop-shadow(0 0 1px rgb(0 0 0 / 0.9)) drop-shadow(0 1px 2px rgb(0 0 0 / 0.55))';

const FADE_STYLE_ID = 'bt-subs-corner-fade';

/**
 * Make a corner button come and go with the player's own controls.
 *
 * In a control bar the button inherits that behaviour for free. Over the
 * picture it would otherwise sit there for the whole video, which is exactly
 * what a player's controls are careful not to do — every one of them fades out
 * so the picture is left alone.
 */
function cornerFollowsControls(selectors: SiteSelectors): void {
  const idle = selectors.autohideClass;
  if (!idle || document.getElementById(FADE_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = FADE_STYLE_ID;
  style.textContent =
    `.${BTN_CLASS} { transition: opacity 200ms ease; }` +
    `${selectors.player}.${idle} .${BTN_CLASS} { opacity: 0; pointer-events: none; }`;
  document.head.appendChild(style);
}
