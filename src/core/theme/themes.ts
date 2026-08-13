import {
  THEME_TOKEN_KEYS,
  type ThemeDefinition,
  type ThemePalette,
  type ThemeTokenKey,
} from '~/storage/schema';

export const DEFAULT_THEME_ID = 'cobalt';

const GEIST_SANS = "'Geist', ui-sans-serif, system-ui, sans-serif";
const GEIST_MONO = "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

/**
 * Four built-in themes. Every palette pairs fg/bg at WCAG AA or better and
 * keeps brand distinguishable on both bg and surface. Cobalt is the shipped
 * pre-v0.1.8 palette verbatim (including the effective dark values — the old
 * .dark block never overrode danger/success). Each theme carries its own
 * typography (system stacks — only Geist ships as a bundled font): Cobalt is
 * the Geist house style, Graphite a neutral grotesque + Consolas, Sepia a
 * serif + typewriter mono, Teal a humanist sans.
 */
export const BUILT_IN_THEMES: readonly ThemeDefinition[] = [
  {
    id: 'cobalt',
    name: 'Cobalt',
    fonts: { sans: GEIST_SANS, mono: GEIST_MONO },
    colors: {
      light: {
        bg: '252 252 250', surface: '255 255 255', fg: '24 24 27',
        'fg-muted': '113 113 122', 'fg-subtle': '161 161 170',
        border: '228 228 231', 'border-strong': '212 212 216',
        brand: '37 99 235', 'brand-fg': '255 255 255', 'brand-soft': '219 234 254',
        danger: '220 38 38', success: '22 163 74',
      },
      dark: {
        bg: '10 10 10', surface: '23 23 23', fg: '244 244 245',
        'fg-muted': '161 161 170', 'fg-subtle': '113 113 122',
        border: '39 39 42', 'border-strong': '63 63 70',
        brand: '59 130 246', 'brand-fg': '255 255 255', 'brand-soft': '30 58 138',
        danger: '220 38 38', success: '22 163 74',
      },
    },
  },
  {
    id: 'graphite',
    name: 'Graphite',
    fonts: {
      sans: "'Segoe UI', -apple-system, 'Helvetica Neue', Arial, sans-serif",
      mono: "Consolas, 'Cascadia Mono', ui-monospace, monospace",
    },
    colors: {
      light: {
        bg: '250 250 250', surface: '255 255 255', fg: '23 23 23',
        'fg-muted': '115 115 115', 'fg-subtle': '163 163 163',
        border: '229 229 229', 'border-strong': '212 212 212',
        brand: '38 38 38', 'brand-fg': '250 250 250', 'brand-soft': '229 229 229',
        danger: '220 38 38', success: '22 163 74',
      },
      dark: {
        bg: '10 10 10', surface: '23 23 23', fg: '245 245 245',
        'fg-muted': '163 163 163', 'fg-subtle': '115 115 115',
        border: '38 38 38', 'border-strong': '64 64 64',
        brand: '229 229 229', 'brand-fg': '23 23 23', 'brand-soft': '64 64 64',
        danger: '248 113 113', success: '74 222 128',
      },
    },
  },
  {
    id: 'sepia',
    name: 'Sepia',
    fonts: {
      sans: "Georgia, 'Iowan Old Style', 'Times New Roman', serif",
      mono: "'Courier New', Courier, monospace",
    },
    colors: {
      light: {
        bg: '251 247 240', surface: '255 253 248', fg: '60 47 35',
        'fg-muted': '128 108 88', 'fg-subtle': '168 148 128',
        border: '232 222 206', 'border-strong': '214 200 178',
        brand: '146 90 34', 'brand-fg': '255 251 244', 'brand-soft': '240 226 200',
        danger: '185 60 40', success: '74 124 58',
      },
      dark: {
        bg: '26 22 18', surface: '36 31 25', fg: '235 226 212',
        'fg-muted': '176 162 142', 'fg-subtle': '128 116 100',
        border: '56 48 39', 'border-strong': '82 71 58',
        brand: '214 158 90', 'brand-fg': '26 22 18', 'brand-soft': '74 58 38',
        danger: '229 115 92', success: '133 178 106',
      },
    },
  },
  {
    id: 'teal',
    name: 'Teal',
    fonts: {
      sans: "'Trebuchet MS', 'Segoe UI', Verdana, sans-serif",
      mono: "'Cascadia Mono', Consolas, ui-monospace, monospace",
    },
    colors: {
      light: {
        bg: '248 250 250', surface: '255 255 255', fg: '19 32 34',
        'fg-muted': '100 118 120', 'fg-subtle': '148 163 165',
        border: '222 231 231', 'border-strong': '200 214 214',
        brand: '13 124 128', 'brand-fg': '255 255 255', 'brand-soft': '204 236 236',
        danger: '220 38 38', success: '22 163 74',
      },
      dark: {
        bg: '9 14 15', surface: '19 27 28', fg: '235 243 243',
        'fg-muted': '148 166 167', 'fg-subtle': '100 118 120',
        border: '36 48 49', 'border-strong': '58 74 75',
        brand: '44 191 191', 'brand-fg': '9 14 15', 'brand-soft': '16 68 70',
        danger: '248 113 113', success: '74 222 128',
      },
    },
  },
];

export function isBuiltInThemeId(id: string): boolean {
  return BUILT_IN_THEMES.some((t) => t.id === id);
}

/** Resolve a themeId against built-ins + custom themes; stale ids fall back to Cobalt. */
export function resolveThemeDefinition(themeId: string, customThemes: ThemeDefinition[]): ThemeDefinition {
  return (
    BUILT_IN_THEMES.find((t) => t.id === themeId) ??
    customThemes.find((t) => t.id === themeId) ??
    BUILT_IN_THEMES[0]!
  );
}

export class ThemeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ThemeValidationError';
  }
}

const RGB_TRIPLE = /^(\d{1,3}) (\d{1,3}) (\d{1,3})$/;

function isRgbTriple(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const m = value.match(RGB_TRIPLE);
  if (!m) return false;
  return [m[1]!, m[2]!, m[3]!].every((c) => Number(c) <= 255);
}

/** Font values go into style.setProperty — keep them plain family stacks. */
function isSafeFontStack(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= 200 &&
    !/[;{}]/.test(value) &&
    !/url\s*\(/i.test(value)
  );
}

function isFullPalette(value: unknown): value is ThemePalette {
  if (!value || typeof value !== 'object') return false;
  const rec = value as Record<string, unknown>;
  return THEME_TOKEN_KEYS.every((key) => isRgbTriple(rec[key]));
}

/** Structural validation for a STORED theme (normalized: both palettes full). */
export function isValidThemeDefinition(value: unknown): value is ThemeDefinition {
  if (!value || typeof value !== 'object') return false;
  const t = value as Record<string, unknown>;
  if (typeof t.id !== 'string' || t.id.length === 0) return false;
  if (typeof t.name !== 'string' || t.name.trim().length === 0 || t.name.length > 40) return false;
  const colors = t.colors as Record<string, unknown> | undefined;
  if (!colors || !isFullPalette(colors.light) || !isFullPalette(colors.dark)) return false;
  const fonts = t.fonts as Record<string, unknown> | undefined;
  if (!fonts || !isSafeFontStack(fonts.sans) || !isSafeFontStack(fonts.mono)) return false;
  return true;
}

/** Reject keys outside the documented format — typos should fail loudly, not silently no-op. */
function assertOnlyKnownKeys(obj: Record<string, unknown>, allowed: readonly string[], where: string): void {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) {
      throw new ThemeValidationError(`Unknown key "${key}" in ${where}`);
    }
  }
}

/**
 * Parse + validate an uploaded custom-theme JSON and normalize it into a
 * stored ThemeDefinition with a fresh 'custom-<uuid>' id.
 *
 * Upload format (strict — unknown keys anywhere are rejected):
 * { name, colors: { light: <all 12 tokens>, dark?: <subset> },
 *   fonts?: { sans?, mono? } }. Missing dark tokens fall back to the light
 * value; missing fonts fall back to the Geist stacks.
 */
export function parseCustomTheme(parsed: unknown): ThemeDefinition {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ThemeValidationError('Not a theme object');
  }
  const raw = parsed as Record<string, unknown>;
  assertOnlyKnownKeys(raw, ['name', 'colors', 'fonts'], 'the theme root');

  if (typeof raw.name !== 'string' || raw.name.trim().length === 0 || raw.name.length > 40) {
    throw new ThemeValidationError('Theme needs a name (max 40 characters)');
  }

  const colors = raw.colors as Record<string, unknown> | undefined;
  if (!colors || typeof colors !== 'object' || !colors.light || typeof colors.light !== 'object') {
    throw new ThemeValidationError('Theme needs colors.light');
  }
  assertOnlyKnownKeys(colors, ['light', 'dark'], 'colors');
  assertOnlyKnownKeys(colors.light as Record<string, unknown>, THEME_TOKEN_KEYS, 'colors.light');
  const lightRaw = colors.light as Record<string, unknown>;
  const light = {} as ThemePalette;
  for (const key of THEME_TOKEN_KEYS) {
    if (!isRgbTriple(lightRaw[key])) {
      throw new ThemeValidationError(
        `colors.light.${key} must be an RGB triple like "37 99 235"`,
      );
    }
    light[key] = lightRaw[key] as string;
  }

  const darkRaw = (colors.dark && typeof colors.dark === 'object'
    ? colors.dark
    : {}) as Record<string, unknown>;
  assertOnlyKnownKeys(darkRaw, THEME_TOKEN_KEYS, 'colors.dark');
  const dark = {} as ThemePalette;
  for (const key of THEME_TOKEN_KEYS) {
    const value = darkRaw[key];
    if (value !== undefined && !isRgbTriple(value)) {
      throw new ThemeValidationError(
        `colors.dark.${key} must be an RGB triple like "59 130 246"`,
      );
    }
    dark[key] = (value as string | undefined) ?? light[key];
  }

  const fontsRaw = (raw.fonts && typeof raw.fonts === 'object' ? raw.fonts : {}) as Record<string, unknown>;
  assertOnlyKnownKeys(fontsRaw, ['sans', 'mono'], 'fonts');
  const sans = fontsRaw.sans ?? GEIST_SANS;
  const mono = fontsRaw.mono ?? GEIST_MONO;
  if (!isSafeFontStack(sans) || !isSafeFontStack(mono)) {
    throw new ThemeValidationError('Font values must be plain font-family stacks');
  }

  return {
    id: `custom-${crypto.randomUUID()}`,
    name: raw.name.trim(),
    colors: { light, dark },
    fonts: { sans: sans as string, mono: mono as string },
  };
}

/** Keys a theme injects, resolved for one variant — consumed by applyThemeTokens. */
export function themeCssVars(theme: ThemeDefinition, dark: boolean): Record<string, string> {
  const palette = dark ? theme.colors.dark : theme.colors.light;
  const vars: Record<string, string> = {};
  for (const key of THEME_TOKEN_KEYS as readonly ThemeTokenKey[]) {
    vars[`--ap-${key}`] = palette[key];
  }
  vars['--ap-font-sans'] = theme.fonts.sans;
  vars['--ap-font-mono'] = theme.fonts.mono;
  return vars;
}
