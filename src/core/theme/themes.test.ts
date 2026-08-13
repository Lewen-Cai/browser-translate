import { describe, it, expect } from 'vitest';
import {
  BUILT_IN_THEMES,
  DEFAULT_THEME_ID,
  isBuiltInThemeId,
  resolveThemeDefinition,
  isValidThemeDefinition,
  parseCustomTheme,
  themeCssVars,
  ThemeValidationError,
} from './themes';
import { THEME_TOKEN_KEYS } from '~/storage/schema';

const RGB_TRIPLE = /^\d{1,3} \d{1,3} \d{1,3}$/;

function sampleUpload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const light: Record<string, string> = {};
  for (const key of THEME_TOKEN_KEYS) light[key] = '10 20 30';
  return { name: 'My Theme', colors: { light }, ...overrides };
}

describe('BUILT_IN_THEMES', () => {
  it('ships exactly cobalt, graphite, sepia, teal — cobalt first (fallback)', () => {
    expect(BUILT_IN_THEMES.map((t) => t.id)).toEqual(['cobalt', 'graphite', 'sepia', 'teal']);
    expect(BUILT_IN_THEMES[0]!.id).toBe(DEFAULT_THEME_ID);
  });

  it('every theme defines all tokens in both variants as RGB triples', () => {
    for (const theme of BUILT_IN_THEMES) {
      for (const variant of ['light', 'dark'] as const) {
        for (const key of THEME_TOKEN_KEYS) {
          expect(theme.colors[variant][key], `${theme.id}.${variant}.${key}`).toMatch(RGB_TRIPLE);
        }
      }
      expect(theme.fonts.sans.length).toBeGreaterThan(0);
      expect(theme.fonts.mono.length).toBeGreaterThan(0);
    }
  });

  it('cobalt light matches the shipped pre-theme palette', () => {
    const cobalt = BUILT_IN_THEMES[0]!;
    expect(cobalt.colors.light.bg).toBe('252 252 250');
    expect(cobalt.colors.light.brand).toBe('37 99 235');
    expect(cobalt.colors.dark.brand).toBe('59 130 246');
  });

  it('all built-ins pass the stored-theme validator', () => {
    for (const theme of BUILT_IN_THEMES) {
      expect(isValidThemeDefinition(theme), theme.id).toBe(true);
    }
  });
});

describe('resolveThemeDefinition', () => {
  it('finds built-ins and custom themes by id', () => {
    expect(resolveThemeDefinition('sepia', []).id).toBe('sepia');
    const custom = parseCustomTheme(sampleUpload());
    expect(resolveThemeDefinition(custom.id, [custom]).id).toBe(custom.id);
  });

  it('falls back to cobalt for a stale id', () => {
    expect(resolveThemeDefinition('custom-deleted', []).id).toBe('cobalt');
  });

  it('isBuiltInThemeId distinguishes built-ins from customs', () => {
    expect(isBuiltInThemeId('teal')).toBe(true);
    expect(isBuiltInThemeId('custom-x')).toBe(false);
  });
});

describe('parseCustomTheme', () => {
  it('accepts a full light palette and assigns a custom-<uuid> id', () => {
    const theme = parseCustomTheme(sampleUpload());
    expect(theme.id).toMatch(/^custom-[0-9a-f-]{36}$/);
    expect(theme.name).toBe('My Theme');
    expect(theme.colors.light.bg).toBe('10 20 30');
  });

  it('fills missing dark tokens from light (and keeps provided ones)', () => {
    const theme = parseCustomTheme(sampleUpload({
      colors: { ...sampleUpload().colors as object, dark: { bg: '1 2 3' } },
    }));
    expect(theme.colors.dark.bg).toBe('1 2 3');
    expect(theme.colors.dark.fg).toBe('10 20 30'); // fallback to light
  });

  it('defaults fonts to the Geist stacks and accepts custom stacks', () => {
    expect(parseCustomTheme(sampleUpload()).fonts.sans).toContain('Geist');
    const themed = parseCustomTheme(sampleUpload({ fonts: { sans: 'Inter, sans-serif' } }));
    expect(themed.fonts.sans).toBe('Inter, sans-serif');
    expect(themed.fonts.mono).toContain('Geist Mono');
  });

  it('rejects a missing token, a bad triple, and an out-of-range component', () => {
    const missing = sampleUpload();
    delete ((missing.colors as { light: Record<string, string> }).light as Record<string, string>)['brand'];
    expect(() => parseCustomTheme(missing)).toThrow(ThemeValidationError);

    const bad = sampleUpload();
    (bad.colors as { light: Record<string, string> }).light['bg'] = '#ffffff';
    expect(() => parseCustomTheme(bad)).toThrow(ThemeValidationError);

    const range = sampleUpload();
    (range.colors as { light: Record<string, string> }).light['bg'] = '999 0 0';
    expect(() => parseCustomTheme(range)).toThrow(ThemeValidationError);
  });

  it('rejects unsafe font values', () => {
    expect(() => parseCustomTheme(sampleUpload({ fonts: { sans: 'x; background: url(evil)' } })))
      .toThrow(ThemeValidationError);
    expect(() => parseCustomTheme(sampleUpload({ fonts: { mono: 'url(https://evil)' } })))
      .toThrow(ThemeValidationError);
  });

  it('rejects a missing or overlong name and non-objects', () => {
    expect(() => parseCustomTheme(sampleUpload({ name: '' }))).toThrow(ThemeValidationError);
    expect(() => parseCustomTheme(sampleUpload({ name: 'x'.repeat(41) }))).toThrow(ThemeValidationError);
    expect(() => parseCustomTheme(null)).toThrow(ThemeValidationError);
    expect(() => parseCustomTheme('str')).toThrow(ThemeValidationError);
  });

  it('rejects unknown keys at every level (strict format)', () => {
    expect(() => parseCustomTheme(sampleUpload({ author: 'me' })))
      .toThrow(/Unknown key "author" in the theme root/);

    const extraColors = sampleUpload();
    (extraColors.colors as Record<string, unknown>).midtone = {};
    expect(() => parseCustomTheme(extraColors)).toThrow(/Unknown key "midtone" in colors/);

    const extraToken = sampleUpload();
    (extraToken.colors as { light: Record<string, string> }).light['shadow'] = '0 0 0';
    expect(() => parseCustomTheme(extraToken)).toThrow(/Unknown key "shadow" in colors.light/);

    const extraDark = sampleUpload({
      colors: { ...(sampleUpload().colors as object), dark: { bg: '1 2 3', glow: '9 9 9' } },
    });
    expect(() => parseCustomTheme(extraDark)).toThrow(/Unknown key "glow" in colors.dark/);

    expect(() => parseCustomTheme(sampleUpload({ fonts: { serif: 'Georgia' } })))
      .toThrow(/Unknown key "serif" in fonts/);
  });
});

describe('themeCssVars', () => {
  it('maps every token plus the two font vars for the requested variant', () => {
    const cobalt = BUILT_IN_THEMES[0]!;
    const light = themeCssVars(cobalt, false);
    const dark = themeCssVars(cobalt, true);
    expect(Object.keys(light)).toHaveLength(THEME_TOKEN_KEYS.length + 2);
    expect(light['--ap-bg']).toBe('252 252 250');
    expect(dark['--ap-bg']).toBe('10 10 10');
    expect(light['--ap-font-sans']).toContain('Geist');
  });
});
