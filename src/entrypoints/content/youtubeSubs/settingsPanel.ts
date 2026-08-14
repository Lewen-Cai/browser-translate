import {
  MAX_SUBTITLE_FONT_SCALE,
  MAX_SUBTITLE_FONT_WEIGHT,
  MIN_SUBTITLE_FONT_SCALE,
  MIN_SUBTITLE_FONT_WEIGHT,
  DEFAULT_SUBTITLE_STYLE,
  DEFAULT_SUBTITLE_TEXT_STYLE,
  SUBTITLE_FONT_FAMILY_IDS,
  type SubtitleDisplayMode,
  type SubtitleFontFamily,
  type SubtitleStyle,
  type SubtitleTextStyle,
  type SubtitleTranslationPosition,
} from '~/core/subtitles/style';
import {
  CHEVRON_LEFT_ICON,
  CHEVRON_RIGHT_ICON,
  LANGUAGES_ICON,
  RESET_ICON,
  SETTINGS_ICON,
  SLIDERS_ICON,
  SUBTITLES_ICON,
} from './icons';

export interface SubtitlePanelStrings {
  subtitlesToggle: string;
  styleTitle: string;
  general: string;
  displayMode: string;
  displayBilingual: string;
  displayOriginalOnly: string;
  displayTranslationOnly: string;
  translationPosition: string;
  positionAbove: string;
  positionBelow: string;
  backgroundOpacity: string;
  mainSubtitle: string;
  translationSubtitle: string;
  fontScale: string;
  color: string;
  fontFamily: string;
  fontWeight: string;
  reset: string;
  resetAll: string;
  back: string;
}

export interface SettingsPanelDeps {
  strings: SubtitlePanelStrings;
  isActive: () => boolean;
  onActiveChange: (on: boolean) => void;
  getStyle: () => SubtitleStyle;
  onStyleChange: (next: SubtitleStyle) => void;
  onResetPosition: () => void;
}

export interface SettingsPanel {
  el: HTMLElement;
  isOpen: () => boolean;
  toggle: () => void;
  close: () => void;
  /** Lift the panel clear of the control bar, in player pixels. */
  setBottomOffset: (px: number) => void;
  destroy: () => void;
}

/** Font stacks are named after the face, not translated. */
const FONT_LABELS: Record<SubtitleFontFamily, string> = {
  youtube: 'YouTube',
  sans: 'Noto Sans',
  serif: 'Source Han Serif',
};

function svgSpan(className: string, markup: string): HTMLElement {
  const el = document.createElement('span');
  el.className = className;
  el.innerHTML = markup; // static module constant, no interpolation
  return el;
}

function iconButton(markup: string, label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'icon-button';
  button.title = label;
  button.setAttribute('aria-label', label);
  button.innerHTML = markup; // static module constant
  button.addEventListener('click', onClick);
  return button;
}

function row(name: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'row';
  const label = document.createElement('span');
  label.className = 'name';
  label.textContent = name;
  el.appendChild(label);
  return el;
}

function selectRow<T extends string>(
  name: string,
  value: T,
  options: Array<{ value: T; label: string }>,
  onChange: (next: T) => void,
): HTMLElement {
  const el = row(name);
  const select = document.createElement('select');
  for (const option of options) {
    const node = document.createElement('option');
    node.value = option.value;
    node.textContent = option.label;
    select.appendChild(node);
  }
  select.value = value;
  select.addEventListener('change', () => onChange(select.value as T));
  el.appendChild(select);
  return el;
}

function sliderRow(
  name: string,
  value: number,
  min: number,
  max: number,
  step: number,
  format: (v: number) => string,
  onCommit: (next: number) => void,
): HTMLElement {
  const el = document.createElement('div');
  el.className = 'row slider-row';
  const head = document.createElement('div');
  head.className = 'slider-head';
  const label = document.createElement('span');
  label.className = 'name';
  label.textContent = name;
  const readout = document.createElement('span');
  readout.className = 'value';
  readout.textContent = format(value);
  head.append(label, readout);

  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  // The readout follows the thumb, but only the released value is stored: a
  // write per pointermove would queue a storage round-trip per frame.
  input.addEventListener('input', () => { readout.textContent = format(Number(input.value)); });
  input.addEventListener('change', () => onCommit(Number(input.value)));

  el.append(head, input);
  return el;
}

function colorRow(name: string, value: string, onChange: (next: string) => void): HTMLElement {
  const el = row(name);
  const input = document.createElement('input');
  input.type = 'color';
  input.value = value;
  input.addEventListener('change', () => onChange(input.value));
  el.appendChild(input);
  return el;
}

function groupBlock(icon: string, title: string, resetLabel: string, onReset: () => void) {
  const block = document.createElement('div');
  block.className = 'group-block';
  const head = document.createElement('div');
  head.className = 'group-head';
  const titleEl = document.createElement('div');
  titleEl.className = 'group-title';
  titleEl.append(svgSpan('', icon), document.createTextNode(title));
  head.append(titleEl, iconButton(RESET_ICON, resetLabel, onReset));
  const rows = document.createElement('div');
  rows.className = 'rows';
  block.append(head, rows);
  return { block, rows };
}

/**
 * The in-player settings menu: a toggle and a route into the style page, drawn
 * over the bottom-right of the picture and lifted clear of the control bar.
 *
 * It is plain DOM rather than a Preact tree because it lives in the same shadow
 * root as the subtitles, where none of the extension's design tokens or Tailwind
 * classes are available — every rule it needs is in `SUBTITLES_CSS`.
 */
export function createSettingsPanel(deps: SettingsPanelDeps): SettingsPanel {
  const s = deps.strings;
  let view: 'main' | 'style' = 'main';
  let open = false;

  const el = document.createElement('div');
  el.className = 'panel';
  el.dataset.open = 'false';

  const header = document.createElement('div');
  header.className = 'panel-header';
  const headerTitle = document.createElement('span');
  const body = document.createElement('div');
  body.className = 'panel-body';
  el.append(header, body);

  // Nothing in the panel should reach the player underneath: a stray press over
  // the picture pauses the video, and over an end screen it navigates away.
  for (const type of ['pointerdown', 'mousedown', 'click', 'dblclick'] as const) {
    el.addEventListener(type, (e) => e.stopPropagation());
  }

  function patchStyle(patch: Partial<SubtitleStyle>): void {
    deps.onStyleChange({ ...deps.getStyle(), ...patch });
  }

  function patchText(which: 'main' | 'translation', patch: Partial<SubtitleTextStyle>): void {
    const current = deps.getStyle();
    patchStyle({ [which]: { ...current[which], ...patch } } as Partial<SubtitleStyle>);
  }

  function renderMain(): void {
    header.style.display = 'none';
    body.textContent = '';

    const toggle = document.createElement('div');
    toggle.className = 'menu-item';
    toggle.append(svgSpan('icon', SUBTITLES_ICON));
    const toggleLabel = document.createElement('span');
    toggleLabel.className = 'label';
    toggleLabel.textContent = s.subtitlesToggle;
    const toggleSwitch = document.createElement('button');
    toggleSwitch.type = 'button';
    toggleSwitch.className = 'switch';
    toggleSwitch.setAttribute('role', 'switch');
    toggleSwitch.setAttribute('aria-label', s.subtitlesToggle);
    toggleSwitch.setAttribute('aria-checked', String(deps.isActive()));
    const flip = () => {
      const next = !deps.isActive();
      deps.onActiveChange(next);
      toggleSwitch.setAttribute('aria-checked', String(next));
    };
    toggleSwitch.addEventListener('click', flip);
    toggle.addEventListener('click', (e) => { if (e.target !== toggleSwitch) flip(); });
    toggle.append(toggleLabel, toggleSwitch);

    const styleEntry = document.createElement('button');
    styleEntry.type = 'button';
    styleEntry.className = 'menu-item';
    styleEntry.append(svgSpan('icon', SLIDERS_ICON));
    const styleLabel = document.createElement('span');
    styleLabel.className = 'label';
    styleLabel.textContent = s.styleTitle;
    styleEntry.append(styleLabel, svgSpan('icon', CHEVRON_RIGHT_ICON));
    styleEntry.addEventListener('click', () => { view = 'style'; render(); });

    body.append(toggle, styleEntry);
  }

  function textGroup(
    icon: string,
    title: string,
    which: 'main' | 'translation',
  ): HTMLElement {
    const value = deps.getStyle()[which];
    const { block, rows } = groupBlock(icon, title, s.reset, () => {
      patchText(which, DEFAULT_SUBTITLE_TEXT_STYLE);
      render();
    });
    rows.append(
      sliderRow(
        s.fontScale, value.fontScale,
        MIN_SUBTITLE_FONT_SCALE, MAX_SUBTITLE_FONT_SCALE, 5,
        (v) => `${v}%`,
        (v) => patchText(which, { fontScale: v }),
      ),
      colorRow(s.color, value.color, (v) => patchText(which, { color: v })),
      selectRow<SubtitleFontFamily>(
        s.fontFamily, value.fontFamily,
        SUBTITLE_FONT_FAMILY_IDS.map((id) => ({ value: id, label: FONT_LABELS[id] })),
        (v) => patchText(which, { fontFamily: v }),
      ),
      sliderRow(
        s.fontWeight, value.fontWeight,
        MIN_SUBTITLE_FONT_WEIGHT, MAX_SUBTITLE_FONT_WEIGHT, 100,
        (v) => String(v),
        (v) => patchText(which, { fontWeight: v }),
      ),
    );
    return block;
  }

  function renderStyle(): void {
    const style = deps.getStyle();
    header.style.display = 'flex';
    header.textContent = '';
    headerTitle.textContent = s.styleTitle;
    header.append(
      iconButton(CHEVRON_LEFT_ICON, s.back, () => { view = 'main'; render(); }),
      headerTitle,
    );
    body.textContent = '';

    const general = groupBlock(SETTINGS_ICON, s.general, s.reset, () => {
      patchStyle({
        displayMode: DEFAULT_SUBTITLE_STYLE.displayMode,
        translationPosition: DEFAULT_SUBTITLE_STYLE.translationPosition,
        backgroundOpacity: DEFAULT_SUBTITLE_STYLE.backgroundOpacity,
      });
      render();
    });

    // Which line goes on top only means something when both are drawn.
    const positionRow = selectRow<SubtitleTranslationPosition>(
      s.translationPosition, style.translationPosition,
      [{ value: 'above', label: s.positionAbove }, { value: 'below', label: s.positionBelow }],
      (v) => patchStyle({ translationPosition: v }),
    );
    const syncPositionRow = (mode: SubtitleDisplayMode) => {
      positionRow.style.display = mode === 'bilingual' ? '' : 'none';
    };
    syncPositionRow(style.displayMode);

    general.rows.append(
      selectRow<SubtitleDisplayMode>(
        s.displayMode, style.displayMode,
        [
          { value: 'bilingual', label: s.displayBilingual },
          { value: 'originalOnly', label: s.displayOriginalOnly },
          { value: 'translationOnly', label: s.displayTranslationOnly },
        ],
        (v) => { patchStyle({ displayMode: v }); syncPositionRow(v); },
      ),
      positionRow,
      sliderRow(
        s.backgroundOpacity, style.backgroundOpacity, 0, 100, 5,
        (v) => `${v}%`,
        (v) => patchStyle({ backgroundOpacity: v }),
      ),
    );

    // The per-group buttons above reset their own group. This one is the whole
    // page: every style setting and the block's position, which is what someone
    // reaches for after changing several things and wanting out of all of them.
    const resetAll = document.createElement('button');
    resetAll.type = 'button';
    resetAll.className = 'menu-item';
    resetAll.append(svgSpan('icon', RESET_ICON));
    const resetLabel = document.createElement('span');
    resetLabel.className = 'label';
    resetLabel.textContent = s.resetAll;
    resetAll.append(resetLabel);
    resetAll.addEventListener('click', () => {
      deps.onStyleChange(DEFAULT_SUBTITLE_STYLE);
      deps.onResetPosition();
      render(); // the controls still show what was just thrown away
    });

    body.append(
      general.block,
      textGroup(SUBTITLES_ICON, s.mainSubtitle, 'main'),
      textGroup(LANGUAGES_ICON, s.translationSubtitle, 'translation'),
      resetAll,
    );
  }

  function render(): void {
    if (view === 'style') renderStyle();
    else renderMain();
  }

  function setOpen(next: boolean): void {
    open = next;
    el.dataset.open = String(next);
    if (next) render();
  }

  // A press anywhere else closes the panel, and so does Escape. The listener is
  // on the document in the capture phase because the press we care about most
  // lands on the player, which stops plenty of events on its own.
  function onDocumentPointerDown(e: PointerEvent): void {
    if (!open) return;
    if (e.composedPath().includes(el)) return;
    // The control-bar button owns opening and closing; letting this fire too
    // would close and reopen the panel in the same press.
    if (e.composedPath().some((n) => n instanceof Element && n.closest?.('.bt-yt-subs-button'))) {
      return;
    }
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (open && e.key === 'Escape') setOpen(false);
  }

  document.addEventListener('pointerdown', onDocumentPointerDown, true);
  document.addEventListener('keydown', onKeyDown, true);

  render();

  return {
    el,
    isOpen: () => open,
    toggle: () => setOpen(!open),
    close: () => setOpen(false),
    setBottomOffset: (px) => { el.style.bottom = `${Math.round(px)}px`; },
    destroy: () => {
      document.removeEventListener('pointerdown', onDocumentPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
      el.remove();
    },
  };
}
