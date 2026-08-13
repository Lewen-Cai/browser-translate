import { themeCssVars } from '~/core/theme/themes';
import type { ThemeDefinition } from '~/storage/schema';

/**
 * Inject the resolved palette + fonts as inline custom properties on `el`.
 * Inline properties beat both the stylesheet defaults (:root/:host) and the
 * .dark override block, and cascade into all descendants — including shadow
 * content when `el` is the in-shadow container. Applied unconditionally (also
 * for the default Cobalt theme): the same var set is always overwritten, so
 * no cleanup pass is needed.
 */
export function applyThemeTokens(el: HTMLElement, theme: ThemeDefinition, dark: boolean): void {
  for (const [name, value] of Object.entries(themeCssVars(theme, dark))) {
    el.style.setProperty(name, value);
  }
}
