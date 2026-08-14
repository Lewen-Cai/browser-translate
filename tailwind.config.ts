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
        // Var-backed, so the CJK fall-through defined in theme.css applies to
        // every utility class as well.
        sans: 'var(--ap-font-sans)',
        mono: 'var(--ap-font-mono)',
      },
      // Softer than Tailwind's defaults across the board. Rounding is set here
      // rather than by rewriting every class, so the whole UI stays consistent
      // and one edit changes the whole feel.
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '15px', letterSpacing: '0.04em' }],
      },
      letterSpacing: {
        wider: '0.08em',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
} satisfies Config;
