import path from 'node:path';
import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import { componentBaseName, isComponentName } from '../utils/ast';

export type ComponentImportsOptions = [
  {
    /** Directory that holds shared, multi-use components. Default: `src/components`. */
    sharedDir?: string;
    /** Project root used to resolve `sharedDir` and root-relative imports. Defaults to the ESLint cwd. */
    rootDir?: string;
    /** Import-path prefix aliases, e.g. `{ "@/": "src/" }`. */
    aliases?: Record<string, string>;
  }?,
];

export type ComponentImportsMessageIds = 'crossBranch';

const VIRTUAL = new Set(['<input>', '<text>']);

const under = (target: string, dir: string): boolean =>
  target === dir || target.startsWith(dir + path.sep);

export default ESLintUtils.RuleCreator.withoutDocs<
  ComponentImportsOptions,
  ComponentImportsMessageIds
>({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce Fractal import boundaries: a component may import components only from the shared components directory or its own same-named child folder',
    },
    schema: [
      {
        type: 'object',
        properties: {
          sharedDir: { type: 'string' },
          rootDir: { type: 'string' },
          aliases: {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      crossBranch:
        "'{{current}}' may import components only from '{{sharedDir}}' or its own './{{childDir}}/' folder; '{{importPath}}' is outside both.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    const filename = context.filename;
    if (!filename || VIRTUAL.has(filename)) return {};

    const base = componentBaseName(filename);
    // Only files that are themselves components are constrained.
    if (!isComponentName(base)) return {};

    const options = context.options[0] ?? {};
    const cwd = options.rootDir ? path.resolve(options.rootDir) : context.cwd;
    const sharedDir = options.sharedDir ?? 'src/components';
    const aliases = options.aliases ?? {};

    const fileDir = path.dirname(filename);
    const childDirName = base.charAt(0).toLowerCase() + base.slice(1);
    const childDir = path.resolve(fileDir, childDirName);
    const sharedRoot = path.isAbsolute(sharedDir)
      ? sharedDir
      : path.resolve(cwd, sharedDir);

    const importsComponent = (node: TSESTree.ImportDeclaration): boolean => {
      if (node.importKind === 'type') return false;
      return node.specifiers.some((spec) => {
        if (spec.type === 'ImportDefaultSpecifier') {
          return isComponentName(spec.local.name);
        }
        if (spec.type === 'ImportSpecifier') {
          return spec.importKind !== 'type' && isComponentName(spec.local.name);
        }
        return false;
      });
    };

    const resolveSource = (source: string): string | null => {
      if (source.startsWith('.')) return path.resolve(fileDir, source);

      for (const [prefix, replacement] of Object.entries(aliases)) {
        if (source === prefix || source.startsWith(prefix)) {
          return path.resolve(cwd, replacement, source.slice(prefix.length));
        }
      }
      if (source.startsWith('/')) return path.resolve(cwd, source.slice(1));
      if (source.startsWith('src/')) return path.resolve(cwd, source);
      // Bare package import (react, @scope/pkg, ...) is never constrained.
      return null;
    };

    return {
      ImportDeclaration(node) {
        if (!importsComponent(node)) return;

        const resolved = resolveSource(node.source.value);
        if (resolved === null) return;
        if (under(resolved, sharedRoot) || under(resolved, childDir)) return;

        context.report({
          node,
          messageId: 'crossBranch',
          data: {
            current: base,
            childDir: childDirName,
            sharedDir,
            importPath: node.source.value,
          },
        });
      },
    };
  },
});
