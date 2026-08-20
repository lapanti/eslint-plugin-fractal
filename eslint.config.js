import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintPlugin from 'eslint-plugin-eslint-plugin';
import n from 'eslint-plugin-n';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['dist/', 'coverage/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      'n/no-deprecated-api': 'error',
      'n/no-extraneous-import': 'error',
      'n/no-unsupported-features/es-builtins': 'error',
      'n/no-unsupported-features/es-syntax': 'error',
      'n/no-unsupported-features/node-builtins': 'error',
      'n/prefer-node-protocol': 'error',
    },
    plugins: { n },
  },
  {
    ...eslintPlugin.configs['rules-recommended'],
    files: ['src/rules/**/*.ts'],
  },
  {
    ...eslintPlugin.configs['tests-recommended'],
    files: ['tests/**/*.test.ts'],
  },
);
