/**
 * Inline glyphs for the in-player UI. Static strings with no interpolation, so
 * assigning them to innerHTML inside our own shadow root carries nothing from
 * the page or the viewer.
 */

const OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
  + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';

export const SUBTITLES_ICON = OPEN
  + '<rect x="2" y="5" width="20" height="14" rx="2"/>'
  + '<path d="M7 15h4M15 15h2M7 11h2M13 11h4"/></svg>';

export const SLIDERS_ICON = OPEN
  + '<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h10M18 18h2"/>'
  + '<circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="18" r="2"/></svg>';

export const CHEVRON_LEFT_ICON = OPEN + '<path d="m15 18-6-6 6-6"/></svg>';

export const CHEVRON_RIGHT_ICON = OPEN + '<path d="m9 18 6-6-6-6"/></svg>';

export const RESET_ICON = OPEN
  + '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>';

export const SETTINGS_ICON = OPEN
  + '<circle cx="12" cy="12" r="3"/>'
  + '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0'
  + '-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0'
  + '-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3'
  + 'a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83'
  + 'l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 '
  + '1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9'
  + 'a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';

export const LANGUAGES_ICON = OPEN
  + '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/>'
  + '<path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>';
