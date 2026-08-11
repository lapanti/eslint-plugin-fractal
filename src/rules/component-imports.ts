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
    /** Also allow importing from a same-named folder (e.g. `components`) at any ancestor directory, not just `sharedDir`. Default: `false`. */
    allowAncestorSharedDirs?: boolean;
  }?,
];

export type ComponentImportsMessageIds =
  'crossBranch' | 'crossBranchWithAncestors';

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
          allowAncestorSharedDirs: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      crossBranch:
        "'{{current}}' may import components only from '{{sharedDir}}' or its own './{{childDir}}/' folder; '{{importPath}}' is outside both.",
      crossBranchWithAncestors:
        "'{{current}}' may import components only from '{{sharedDir}}', its own './{{childDir}}/' folder, or an ancestor '{{sharedDirBasename}}' folder; '{{importPath}}' is outside all of them.",
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
    const allowAncestorSharedDirs = options.allowAncestorSharedDirs ?? false;

    const fileDir = path.dirname(filename);
    const childDirName = base.charAt(0).toLowerCase() + base.slice(1);
    const childDir = path.resolve(fileDir, childDirName);
    const sharedRoot = path.isAbsolute(sharedDir)
      ? sharedDir
      : path.resolve(cwd, sharedDir);
    const sharedDirBasename = path.basename(sharedDir);

    // With allowAncestorSharedDirs, a `<sharedDirBasename>` folder at any
    // ancestor level (up to rootDir) is also a valid import source — not
    // just the configured sharedDir itself.
    const isUnderAncestorSharedDir = (target: string): boolean => {
      let dir = fileDir;
      for (;;) {
        if (under(target, path.resolve(dir, sharedDirBasename))) return true;
        if (dir === cwd) return false;
        const parent = path.dirname(dir);
        if (parent === dir) return false;
        dir = parent;
      }
    };

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
        if (allowAncestorSharedDirs && isUnderAncestorSharedDir(resolved))
          return;

        context.report({
          node,
          messageId: allowAncestorSharedDirs
            ? 'crossBranchWithAncestors'
            : 'crossBranch',
          data: {
            current: base,
            childDir: childDirName,
            sharedDir,
            sharedDirBasename,
            importPath: node.source.value,
          },
        });
      },
    };
  },
});
