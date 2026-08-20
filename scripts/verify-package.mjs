import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import process from 'node:process';
import { Linter } from 'eslint';

const require = createRequire(import.meta.url);
const esmPlugin = (await import('eslint-plugin-fractal')).default;
const cjsPlugin = require('eslint-plugin-fractal');

const verifyPlugin = (plugin, format) => {
  assert.equal(plugin.meta.name, 'eslint-plugin-fractal');
  assert.equal(plugin.meta.namespace, 'fractal');
  assert.equal(plugin.default, undefined, `${format} exposed a nested default`);

  const linter = new Linter({ configType: 'flat' });
  const messages = linter.verify(
    'function A() { return <div />; }\nfunction B() { return <span />; }',
    [
      {
        files: ['**/*.tsx'],
        plugins: { fractal: plugin },
        languageOptions: {
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
        rules: { 'fractal/one-component-per-file': 'error' },
      },
    ],
    'src/App.tsx',
  );

  assert.equal(messages.length, 1);
  assert.equal(messages[0]?.ruleId, 'fractal/one-component-per-file');
};

verifyPlugin(esmPlugin, 'ESM');
verifyPlugin(cjsPlugin, 'CommonJS');

const esmDeclaration = await readFile('dist/index.d.ts', 'utf8');
const cjsDeclaration = await readFile('dist/index.d.cts', 'utf8');

assert.match(esmDeclaration, /plugin as default/);
assert.match(cjsDeclaration, /export = plugin;/);

const packArgs = ['pack', '--dry-run', '--json', '--ignore-scripts'];
const npmExecPath = process.env.npm_execpath;
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packOutput = npmExecPath
  ? execFileSync(process.execPath, [npmExecPath, ...packArgs], {
      encoding: 'utf8',
    })
  : execFileSync(npmCommand, packArgs, {
      encoding: 'utf8',
    });
const [pack] = JSON.parse(packOutput);
const files = pack.files
  .map(({ path }) => path)
  .sort((left, right) => left.localeCompare(right));
const expectedFiles = [
  'LICENSE',
  'README.md',
  'dist/index.cjs',
  'dist/index.cjs.map',
  'dist/index.d.cts',
  'dist/index.d.ts',
  'dist/index.js',
  'dist/index.js.map',
  'docs/rules/component-imports.md',
  'docs/rules/one-component-per-file.md',
  'package.json',
].sort((left, right) => left.localeCompare(right));

assert.deepEqual(files, expectedFiles);
process.stdout.write(
  'Package exports, declarations, ESLint integration, and files verified.\n',
);
