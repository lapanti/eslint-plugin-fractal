import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import {
  componentBaseName,
  isComponentName,
  isVirtualFilename,
} from '../utils/ast';
import { createRule } from '../utils/create-rule';

export interface ComponentExportStyleOption {
  /** Export style required for the file's own component. Default: `named`. */
  style?: 'named' | 'default';
}

export type ComponentExportStyleOptions = [ComponentExportStyleOption?];

export type ComponentExportStyleMessageIds =
  'expectedNamed' | 'expectedDefault';

type DefaultExportInfo =
  | {
      kind: 'declaration';
      reportNode: TSESTree.Node;
      statement: TSESTree.ExportDefaultDeclaration;
      declaration: TSESTree.Node;
    }
  | {
      kind: 'identifier';
      reportNode: TSESTree.Node;
      statement: TSESTree.ExportDefaultDeclaration;
    }
  | {
      kind: 'specifier';
      reportNode: TSESTree.Node;
      statement: TSESTree.ExportNamedDeclaration;
      specifier: TSESTree.ExportSpecifier;
      soleSpecifier: boolean;
    }
  | { kind: 'opaque'; reportNode: TSESTree.Node };

type NamedExportInfo =
  | {
      kind: 'declaration';
      reportNode: TSESTree.Node;
      statement: TSESTree.ExportNamedDeclaration;
      declaration: TSESTree.Node;
    }
  | {
      kind: 'variable';
      reportNode: TSESTree.Node;
      statement: TSESTree.ExportNamedDeclaration;
      declaration: TSESTree.Node;
      soleDeclarator: boolean;
    }
  | {
      kind: 'specifier';
      reportNode: TSESTree.Node;
      statement: TSESTree.ExportNamedDeclaration;
      soleSpecifier: boolean;
    };

interface ExportSummary {
  defaultExport: DefaultExportInfo | null;
  namedExport: NamedExportInfo | null;
  hasAnyDefaultExport: boolean;
}

// Default exports whose value cannot be turned back into a safe named export.
const OPAQUE_DEFAULTS = new Set<string>([
  'ArrowFunctionExpression',
  'FunctionExpression',
  'ClassExpression',
  'CallExpression',
  'TSAsExpression',
  'TSNonNullExpression',
  'TSSatisfiesExpression',
  'TSTypeAssertion',
]);

const specifierName = (
  node: TSESTree.Identifier | TSESTree.StringLiteral,
): string => (node.type === 'Identifier' ? node.name : node.value);

/** `null` means the default export is not this file's component. */
const defaultInfo = (
  statement: TSESTree.ExportDefaultDeclaration,
  base: string,
): DefaultExportInfo | null => {
  const declaration = statement.declaration;

  if (
    declaration.type === 'FunctionDeclaration' ||
    declaration.type === 'ClassDeclaration'
  ) {
    const id = declaration.id;
    if (!id) return { kind: 'opaque', reportNode: statement };
    if (id.name !== base) return null;
    return {
      kind: 'declaration',
      reportNode: statement,
      statement,
      declaration,
    };
  }

  if (declaration.type === 'Identifier') {
    if (declaration.name !== base) return null;
    return { kind: 'identifier', reportNode: statement, statement };
  }

  if (OPAQUE_DEFAULTS.has(declaration.type)) {
    return { kind: 'opaque', reportNode: statement };
  }

  return null;
};

const namedInfo = (
  statement: TSESTree.ExportNamedDeclaration,
  declaration: NonNullable<TSESTree.ExportNamedDeclaration['declaration']>,
  base: string,
): NamedExportInfo | null => {
  if (
    declaration.type === 'FunctionDeclaration' ||
    declaration.type === 'ClassDeclaration'
  ) {
    const id = declaration.id;
    if (!id) return null;
    if (id.name !== base) return null;
    return { kind: 'declaration', reportNode: id, statement, declaration };
  }

  if (declaration.type !== 'VariableDeclaration') return null;

  const declarator = declaration.declarations.find(
    (candidate) =>
      candidate.id.type === 'Identifier' && candidate.id.name === base,
  );
  if (!declarator) return null;

  return {
    kind: 'variable',
    reportNode: declarator.id,
    statement,
    declaration,
    soleDeclarator: declaration.declarations.length === 1,
  };
};

const collectSpecifiers = (
  statement: TSESTree.ExportNamedDeclaration,
  base: string,
  summary: ExportSummary,
): void => {
  for (const specifier of statement.specifiers) {
    if (specifier.exportKind === 'type') continue;

    const exported = specifierName(specifier.exported);
    if (exported === 'default') summary.hasAnyDefaultExport = true;
    if (specifierName(specifier.local) !== base) continue;

    if (exported === 'default') {
      summary.defaultExport ??= {
        kind: 'specifier',
        reportNode: specifier,
        statement,
        specifier,
        soleSpecifier: statement.specifiers.length === 1,
      };
      continue;
    }

    summary.namedExport ??= {
      kind: 'specifier',
      reportNode: specifier,
      statement,
      soleSpecifier: statement.specifiers.length === 1,
    };
  }
};

const collectExports = (
  program: TSESTree.Program,
  base: string,
): ExportSummary => {
  const summary: ExportSummary = {
    defaultExport: null,
    namedExport: null,
    hasAnyDefaultExport: false,
  };

  for (const statement of program.body) {
    if (statement.type === 'ExportDefaultDeclaration') {
      summary.hasAnyDefaultExport = true;
      summary.defaultExport ??= defaultInfo(statement, base);
      continue;
    }

    if (statement.type !== 'ExportNamedDeclaration') continue;
    if (statement.exportKind === 'type') continue;
    // A re-export names another module's binding, not this file's component.
    if (statement.source) continue;

    const declaration = statement.declaration;
    if (declaration) {
      summary.namedExport ??= namedInfo(statement, declaration, base);
      continue;
    }

    collectSpecifiers(statement, base, summary);
  }

  return summary;
};

const namedFix = (
  info: DefaultExportInfo,
  hasNamedExport: boolean,
  base: string,
): TSESLint.ReportFixFunction | null => {
  // Rewriting into a named export would collide with one that already exists,
  // so only the redundant default export can be removed.
  if (hasNamedExport) {
    if (info.kind === 'identifier') {
      const { statement } = info;
      return (fixer) => fixer.remove(statement);
    }
    if (info.kind === 'specifier' && info.soleSpecifier) {
      const { statement } = info;
      return (fixer) => fixer.remove(statement);
    }
    return null;
  }
  if (info.kind === 'declaration') {
    const { statement, declaration } = info;
    return (fixer) =>
      fixer.replaceTextRange(
        [statement.range[0], declaration.range[0]],
        'export ',
      );
  }
  if (info.kind === 'identifier') {
    const { statement } = info;
    return (fixer) => fixer.replaceText(statement, `export { ${base} };`);
  }
  if (info.kind === 'specifier') {
    const { specifier } = info;
    return (fixer) => fixer.replaceText(specifier, base);
  }
  return null;
};

const defaultFix = (
  info: NamedExportInfo,
  base: string,
): TSESLint.ReportFixFunction | null => {
  if (info.kind === 'declaration') {
    const { statement, declaration } = info;
    return (fixer) =>
      fixer.replaceTextRange(
        [statement.range[0], declaration.range[0]],
        'export default ',
      );
  }
  if (info.kind === 'variable') {
    if (!info.soleDeclarator) return null;
    const { statement, declaration } = info;
    return (fixer) => [
      fixer.replaceTextRange([statement.range[0], declaration.range[0]], ''),
      fixer.insertTextAfter(statement, `\nexport default ${base};`),
    ];
  }
  if (!info.soleSpecifier) return null;
  const { statement } = info;
  return (fixer) => fixer.replaceText(statement, `export default ${base};`);
};

export default createRule<
  ComponentExportStyleOptions,
  ComponentExportStyleMessageIds
>({
  name: 'component-export-style',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        "Enforce a consistent export style for a file's own React component",
    },
    fixable: 'code',
    defaultOptions: [{}],
    schema: [
      {
        type: 'object',
        properties: {
          style: {
            type: 'string',
            enum: ['named', 'default'],
            description: "Export style required for the file's component.",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      expectedNamed:
        "Component '{{name}}' must use a named export, not a default export.",
      expectedDefault:
        "Component '{{name}}' must use a default export, not a named export.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    const filename = context.filename;
    if (!filename || isVirtualFilename(filename)) return {};

    const base = componentBaseName(filename);
    // Only a file named after a component declares that component.
    if (!isComponentName(base)) return {};

    const style = context.options[0]?.style ?? 'named';

    return {
      Program(program) {
        const { defaultExport, namedExport, hasAnyDefaultExport } =
          collectExports(program, base);

        if (style === 'named') {
          if (!defaultExport) return;
          context.report({
            node: defaultExport.reportNode,
            messageId: 'expectedNamed',
            data: { name: base },
            fix: namedFix(defaultExport, namedExport !== null, base),
          });
          return;
        }

        if (!namedExport) return;
        context.report({
          node: namedExport.reportNode,
          messageId: 'expectedDefault',
          data: { name: base },
          // A second default export would be a syntax error.
          fix: hasAnyDefaultExport ? null : defaultFix(namedExport, base),
        });
      },
    };
  },
});
