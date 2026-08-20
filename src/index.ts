import type { TSESLint } from '@typescript-eslint/utils';
import pkg from '../package.json';
import componentImports from './rules/component-imports';
import oneComponentPerFile from './rules/one-component-per-file';

export type {
  ComponentImportsOption,
  ComponentImportsOptions,
} from './rules/component-imports';

const plugin = {
  meta: {
    name: pkg.name,
    version: pkg.version,
    namespace: 'fractal',
  },
  rules: {
    'component-imports': componentImports,
    'one-component-per-file': oneComponentPerFile,
  },
  configs: {} as {
    recommended: TSESLint.FlatConfig.Config;
  },
};

plugin.configs.recommended = {
  name: 'fractal/recommended',
  plugins: {
    fractal: plugin as unknown as TSESLint.FlatConfig.Plugin,
  },
  rules: {
    'fractal/component-imports': 'error',
    'fractal/one-component-per-file': 'error',
  },
};

export default plugin;
