import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';

const fixtureDir = path.resolve(process.argv[2] ?? process.cwd());
const fixtureRequire = createRequire(path.join(fixtureDir, 'package.json'));

execFileSync(
  process.execPath,
  [
    '--input-type=module',
    '--eval',
    "import plugin from 'eslint-plugin-fractal'; if (plugin.meta.namespace !== 'fractal') throw new Error('ESM export mismatch');",
  ],
  { cwd: fixtureDir, stdio: 'inherit' },
);

execFileSync(
  process.execPath,
  [
    '--eval',
    "const plugin = require('eslint-plugin-fractal'); if (plugin.meta.namespace !== 'fractal' || plugin.default) throw new Error('CommonJS export mismatch');",
  ],
  { cwd: fixtureDir, stdio: 'inherit' },
);

const { Linter } = fixtureRequire('eslint');
const plugin = fixtureRequire('eslint-plugin-fractal');
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
process.stdout.write(
  `Installed package verified with Node ${process.version} and ESLint ${Linter.version}.\n`,
);
