import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Linter, type ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import plugin from '../src/index';

const docsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../docs/rules',
);
const ruleNames = Object.keys(plugin.rules);

describe('plugin metadata', () => {
  it('exposes a meta name and semantic version', () => {
    expect(plugin.meta.name).toBe('eslint-plugin-fractal');
    expect(plugin.meta.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('registers the two fractal rules', () => {
    expect(ruleNames).toEqual(
      expect.arrayContaining(['component-imports', 'one-component-per-file']),
    );
  });

  it.each(ruleNames)('rule "%s" has complete meta', (ruleName) => {
    const ruleModule = plugin.rules[ruleName as keyof typeof plugin.rules];
    expect(ruleModule.meta?.type).toMatch(/problem|suggestion|layout/);
    expect(ruleModule.meta?.docs?.description).toBeTruthy();
    expect(Object.keys(ruleModule.meta?.messages ?? {}).length).toBeGreaterThan(
      0,
    );
    expect(typeof ruleModule.create).toBe('function');
  });

  it.each(ruleNames)('rule "%s" is documented', (ruleName) => {
    expect(readdirSync(docsDir)).toContain(`${ruleName}.md`);
  });

  it('recommended config enables every rule', () => {
    const configured = Object.keys(plugin.configs.recommended.rules ?? {});
    for (const ruleName of ruleNames) {
      expect(configured).toContain(`fractal/${ruleName}`);
    }
  });
});

describe('plugin end-to-end (flat config)', () => {
  it('reports a cross-branch import through the plugin', () => {
    const linter = new Linter();
    const messages = linter.verify(
      "import Settings from '../Settings/Settings';\nexport default function Dashboard() { return <Settings />; }",
      [
        {
          files: ['**/*.tsx'],
          plugins: {
            fractal: plugin as unknown as ESLint.Plugin,
          },
          languageOptions: {
            parserOptions: { ecmaFeatures: { jsx: true } },
          },
          rules: {
            'fractal/component-imports': 'error',
          },
        },
      ],
      'src/pages/Dashboard/Dashboard.tsx',
    );

    expect(messages).toHaveLength(1);
    expect(messages[0]?.ruleId).toBe('fractal/component-imports');
  });
});
