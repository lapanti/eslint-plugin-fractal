import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';

export type OneComponentPerFileMessageIds = 'multiple';

const PASCAL = /^[A-Z]/;

const superclassIsComponent = (
  node: TSESTree.ClassDeclaration | TSESTree.ClassExpression,
): boolean => {
  const superClass = node.superClass;
  if (!superClass) return false;
  if (superClass.type === 'Identifier') {
    return superClass.name.endsWith('Component');
  }
  if (
    superClass.type === 'MemberExpression' &&
    superClass.property.type === 'Identifier'
  ) {
    return superClass.property.name.endsWith('Component');
  }
  return false;
};

const isTopLevel = (node: TSESTree.Node): boolean => {
  const parent = node.parent;
  if (!parent) return false;
  if (parent.type === 'Program') return true;
  return (
    (parent.type === 'ExportNamedDeclaration' ||
      parent.type === 'ExportDefaultDeclaration') &&
    parent.parent?.type === 'Program'
  );
};

const pascalId = (
  id: TSESTree.BindingName | null,
): TSESTree.Identifier | null =>
  id !== null && id.type === 'Identifier' && PASCAL.test(id.name) ? id : null;

type InitializerKind = 'class' | 'function';

const initializerKind = (
  node: TSESTree.Expression | null,
): InitializerKind | null => {
  if (!node) return null;
  if (
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionExpression'
  ) {
    return 'function';
  }
  if (node.type === 'ClassExpression') {
    return superclassIsComponent(node) ? 'class' : null;
  }
  if (
    node.type === 'TSAsExpression' ||
    node.type === 'TSNonNullExpression' ||
    node.type === 'TSSatisfiesExpression' ||
    node.type === 'TSTypeAssertion'
  ) {
    return initializerKind(node.expression);
  }
  if (node.type === 'CallExpression') {
    for (const argument of node.arguments) {
      if (argument.type === 'SpreadElement') continue;
      const kind = initializerKind(argument);
      if (kind) return kind;
    }
  }
  return null;
};

interface Frame {
  name: string;
  reportNode: TSESTree.Node;
  isComponent: boolean;
}

export default ESLintUtils.RuleCreator.withoutDocs<
  [],
  OneComponentPerFileMessageIds
>({
  meta: {
    type: 'suggestion',
    docs: { description: 'Enforce a single React component per file' },
    schema: [],
    messages: {
      multiple:
        "A file may define only one React component; '{{name}}' is an additional component. Move it to its own file.",
    },
  },
  defaultOptions: [],
  create(context) {
    const components: Frame[] = [];
    // Fractal files do not nest top-level components, so one active slot suffices.
    let current: Frame | null = null;

    const open = (
      name: string,
      reportNode: TSESTree.Node,
      isComponent: boolean,
    ): void => {
      current = { name, reportNode, isComponent };
    };
    const close = (): void => {
      if (current?.isComponent) components.push(current);
      current = null;
    };
    const markComponent = (): void => {
      if (current) current.isComponent = true;
    };

    return {
      FunctionDeclaration(node) {
        const id = isTopLevel(node) ? pascalId(node.id) : null;
        if (id) open(id.name, id, false);
      },
      'FunctionDeclaration:exit'(node) {
        if (isTopLevel(node) && pascalId(node.id)) close();
      },
      VariableDeclarator(node) {
        if (node.parent.type !== 'VariableDeclaration') return;
        if (!isTopLevel(node.parent)) return;
        const target = pascalId(node.id);
        if (!target) return;
        const kind = initializerKind(node.init);
        if (kind === 'class') {
          components.push({
            name: target.name,
            reportNode: target,
            isComponent: true,
          });
        } else if (kind === 'function') {
          open(target.name, target, false);
        }
      },
      'VariableDeclarator:exit'(node) {
        if (node.parent.type !== 'VariableDeclaration') return;
        if (!isTopLevel(node.parent)) return;
        const target = pascalId(node.id);
        if (target && initializerKind(node.init) === 'function') close();
      },
      ClassDeclaration(node) {
        const id = isTopLevel(node) ? pascalId(node.id) : null;
        if (id && superclassIsComponent(node)) {
          components.push({
            name: id.name,
            reportNode: id,
            isComponent: true,
          });
        }
      },
      JSXElement: markComponent,
      JSXFragment: markComponent,
      'Program:exit'() {
        for (const component of components.slice(1)) {
          context.report({
            node: component.reportNode,
            messageId: 'multiple',
            data: { name: component.name },
          });
        }
      },
    };
  },
});
