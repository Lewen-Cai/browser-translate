import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import path from 'node:path';

export default defineConfig({
  // tsconfig sets jsx:"preserve" for WXT's build pipeline, which leaves the test
  // runner unable to parse component .tsx. The Preact preset gives the test
  // runner a real JSX transform (the extension build configures it via WXT).
  plugins: [preact()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
      // Zustand's entry imports React, and anything that reaches the store —
      // `~/i18n` does, for its hook — drags that in. The extension build
      // already maps it to Preact's compat layer via WXT's Preact module; the
      // test runner has no such module, so it needs the same map to load a
      // component at all.
      react: 'preact/compat',
      'react-dom': 'preact/compat',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    server: {
      deps: {
        // Aliases do not reach a dependency the runner leaves external, and
        // Zustand's React import has to be rewritten before Node resolves it.
        inline: ['zustand'],
      },
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.*', 'src/entrypoints/**'],
    },
  },
});
