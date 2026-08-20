import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  cjsInterop: true,
  footer: ({ format }) =>
    format === 'cjs'
      ? { js: 'module.exports = module.exports.default ?? module.exports;' }
      : undefined,
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node22',
  outDir: 'dist',
});
