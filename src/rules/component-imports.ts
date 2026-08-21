import path from 'node:path';
import type { TSESTree } from '@typescript-eslint/utils';
import {
  componentBaseName,
  isComponentName,
  isVirtualFilename,
} from '../utils/ast';
import { createRule } from '../utils/create-rule';

export interface ComponentImportsOption {
  /** Directory that holds shared, multi-use components. Default: `src/components`. */
  sharedDir?: string;
  /** Project root used to resolve `sharedDir` and root-relative imports. Defaults to the ESLint cwd. */
  rootDir?: string;
  /** Import-path prefix aliases, e.g. `{ "@/": "src/" }`. */
  aliases?: Record<string, string>;
  /** Also allow importing from a same-named folder (e.g. `components`) at any ancestor directory, not just `sharedDir`. Default: `false`. */
  allowAncestorSharedDirs?: boolean;
}

export type ComponentImportsOptions = [ComponentImportsOption?];

export type ComponentImportsMessageIds =
  'crossBranch' | 'crossBranchWithAncestors';

const under = (target: string, dir: string): boolean => {
  const relative = path.relative(dir, target);
  return (
    relative === '' ||
    (relative !== '..' &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
};

export default createRule<ComponentImportsOptions, ComponentImportsMessageIds>({
  name: 'component-imports',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce Fractal import boundaries: a component may import components only from the shared components directory or its own same-named child folder',
    },
    defaultOptions: [{}],
    schema: [
      {
        type: 'object',
        properties: {
          sharedDir: {
            type: 'string',
            description: 'Directory containing shared components.',
          },
          rootDir: {
            type: 'string',
            description: 'Project root used for path resolution.',
          },
          aliases: {
            type: 'object',
            description: 'Nonempty import prefix aliases.',
            patternProperties: {
              '.+': { type: 'string' },
            },
            additionalProperties: false,
          },
          allowAncestorSharedDirs: {
            type: 'boolean',
            description: 'Allow same-named shared directories below rootDir.',
          },
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
    if (!filename || isVirtualFilename(filename)) return {};

    const absoluteFilename = path.resolve(context.cwd, filename);
    const base = componentBaseName(absoluteFilename);
    // Only files that are themselves components are constrained.
    if (!isComponentName(base)) return {};

    const options = context.options[0] ?? {};
    const cwd = path.resolve(context.cwd, options.rootDir ?? '.');
    const sharedDir = options.sharedDir ?? 'src/components';
    const aliases = options.aliases ?? {};
    const allowAncestorSharedDirs = options.allowAncestorSharedDirs ?? false;

    const fileDir = path.dirname(absoluteFilename);
    const childDirName = base.charAt(0).toLowerCase() + base.slice(1);
    const childDir = path.resolve(fileDir, childDirName);
    const sharedRoot = path.resolve(cwd, sharedDir);
    const sharedDirBasename = path.basename(sharedRoot);
    const aliasEntries = Object.entries(aliases)
      .filter(([prefix]) => prefix.length > 0)
      .sort(([left], [right]) => right.length - left.length);

    // With allowAncestorSharedDirs, a `<sharedDirBasename>` folder at any
    // ancestor level (up to rootDir) is also a valid import source — not
    // just the configured sharedDir itself.
    const isUnderAncestorSharedDir = (target: string): boolean => {
      if (!under(fileDir, cwd)) return false;
      let dir = fileDir;
      for (;;) {
        if (under(target, path.resolve(dir, sharedDirBasename))) return true;
        if (dir === cwd) return false;
        dir = path.dirname(dir);
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

      for (const [prefix, replacement] of aliasEntries) {
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
