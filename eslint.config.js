// ESLint 10 flat config — the eslintrc format is gone as of v10. Same rules as
// the .eslintrc.json it replaces: eslint's and typescript-eslint's recommended
// sets, with unused variables and explicit `any` as warnings.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  { ignores: ['.wxt/', '.output/', 'dist/', 'node_modules/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
