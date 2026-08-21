import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Linter, type ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import plugin, {
  type ComponentExportStyleOption,
  type ComponentImportsOption,
} from '../src/index';

const docsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../docs/rules',
);
const ruleNames = Object.keys(plugin.rules);
// Rules deliberately excluded from the recommended config.
const optInRuleNames = ['component-export-style'];
const sorted = (names: string[]): string[] =>
  [...names].sort((left, right) => left.localeCompare(right));

describe('plugin metadata', () => {
  it('exposes a meta name and semantic version', () => {
    expect(plugin.meta.name).toBe('eslint-plugin-fractal');
    expect(plugin.meta.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(plugin.meta.namespace).toBe('fractal');
  });

  it('registers every fractal rule', () => {
    expect(ruleNames).toEqual(
      expect.arrayContaining([
        'component-export-style',
        'component-imports',
        'one-component-per-file',
      ]),
    );
  });

  it.each(ruleNames)('rule "%s" has complete meta', (ruleName) => {
    const ruleModule = plugin.rules[ruleName as keyof typeof plugin.rules];
    expect(ruleModule.meta?.type).toMatch(/problem|suggestion|layout/);
    expect(ruleModule.meta?.docs?.description).toBeTruthy();
    expect(Object.keys(ruleModule.meta?.messages ?? {}).length).toBeGreaterThan(
      0,
    );
    expect(ruleModule.meta?.docs?.url).toBe(
      `https://github.com/lapanti/eslint-plugin-fractal/blob/main/docs/rules/${ruleName}.md`,
    );
    expect(typeof ruleModule.create).toBe('function');
  });

  it.each(ruleNames)('rule "%s" is documented', (ruleName) => {
    expect(readdirSync(docsDir)).toContain(`${ruleName}.md`);
  });

  it('recommended config enables every rule that is not opt-in', () => {
    const configured = sorted(
      Object.keys(plugin.configs.recommended.rules ?? {}),
    );
    const expected = sorted(
      ruleNames
        .filter((ruleName) => !optInRuleNames.includes(ruleName))
        .map((ruleName) => `fractal/${ruleName}`),
    );

    expect(configured).toEqual(expected);
    expect(plugin.configs.recommended.plugins?.fractal).toBe(plugin);
  });

  it('keeps opt-in rules registered but out of recommended', () => {
    const configured = Object.keys(plugin.configs.recommended.rules ?? {});

    for (const ruleName of optInRuleNames) {
      expect(ruleNames).toContain(ruleName);
      expect(configured).not.toContain(`fractal/${ruleName}`);
    }
  });

  it('exports the component-import option shape', () => {
    const options: ComponentImportsOption = {
      sharedDir: 'src/ui',
      aliases: { '@/': 'src/' },
    };

    expect(options.sharedDir).toBe('src/ui');
  });

  it('exports the component-export-style option shape', () => {
    const options: ComponentExportStyleOption = { style: 'default' };

    expect(options.style).toBe('default');
  });
});

describe('plugin end-to-end (flat config)', () => {
  it('reports a cross-branch import through the plugin', () => {
    const linter = new Linter({ configType: 'flat' });
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

  it('reports an additional component through the plugin', () => {
    const linter = new Linter({ configType: 'flat' });
    const messages = linter.verify(
      'function A() { return <div />; }\nfunction B() { return <span />; }',
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
            'fractal/one-component-per-file': 'error',
          },
        },
      ],
      'src/App.tsx',
    );

    expect(messages).toHaveLength(1);
    expect(messages[0]?.ruleId).toBe('fractal/one-component-per-file');
  });
});
