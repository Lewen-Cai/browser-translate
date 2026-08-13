import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        // Apparatus semantic tokens — usable as bg-ap, text-ap-muted etc.
        ap: {
          DEFAULT: 'rgb(var(--ap-fg) / <alpha-value>)',
          bg:      'rgb(var(--ap-bg) / <alpha-value>)',
          surface: 'rgb(var(--ap-surface) / <alpha-value>)',
          fg:      'rgb(var(--ap-fg) / <alpha-value>)',
          muted:   'rgb(var(--ap-fg-muted) / <alpha-value>)',
          subtle:  'rgb(var(--ap-fg-subtle) / <alpha-value>)',
          border:  'rgb(var(--ap-border) / <alpha-value>)',
          'border-strong': 'rgb(var(--ap-border-strong) / <alpha-value>)',
          brand:   'rgb(var(--ap-brand) / <alpha-value>)',
          'brand-fg': 'rgb(var(--ap-brand-fg) / <alpha-value>)',
          'brand-soft': 'rgb(var(--ap-brand-soft) / <alpha-value>)',
          danger:  'rgb(var(--ap-danger) / <alpha-value>)',
          success: 'rgb(var(--ap-success) / <alpha-value>)',
        },
      },
      fontFamily: {
        // Var-backed so the active theme's fonts flow into font-sans/font-mono.
        sans: 'var(--ap-font-sans)',
        mono: 'var(--ap-font-mono)',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.04em' }],
      },
      letterSpacing: {
        wider: '0.08em',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
} satisfies Config;
