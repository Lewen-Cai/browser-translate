import { describe, it, expect } from 'vitest';
import { applyThemeTokens } from './applyThemeTokens';
import { BUILT_IN_THEMES } from '~/core/theme/themes';

describe('applyThemeTokens', () => {
  it('sets every token and both font vars for the requested variant', () => {
    const el = document.createElement('div');
    const cobalt = BUILT_IN_THEMES[0]!;
    applyThemeTokens(el, cobalt, false);
    expect(el.style.getPropertyValue('--ap-bg')).toBe('252 252 250');
    expect(el.style.getPropertyValue('--ap-brand')).toBe('37 99 235');
    expect(el.style.getPropertyValue('--ap-font-sans')).toContain('Geist');

    applyThemeTokens(el, cobalt, true);
    expect(el.style.getPropertyValue('--ap-bg')).toBe('10 10 10');
    expect(el.style.getPropertyValue('--ap-brand')).toBe('59 130 246');
  });

  it('overwrites a previous theme completely on re-apply', () => {
    const el = document.createElement('div');
    const sepia = BUILT_IN_THEMES.find((t) => t.id === 'sepia')!;
    const cobalt = BUILT_IN_THEMES[0]!;
    applyThemeTokens(el, sepia, false);
    expect(el.style.getPropertyValue('--ap-font-sans')).toContain('Georgia');
    applyThemeTokens(el, cobalt, false);
    expect(el.style.getPropertyValue('--ap-font-sans')).toContain('Geist');
    expect(el.style.getPropertyValue('--ap-bg')).toBe('252 252 250');
  });
});
