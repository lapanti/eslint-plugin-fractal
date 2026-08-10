import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';

export type OneComponentPerFileMessageIds = 'multiple';

const PASCAL = /^[A-Z]/;

const superclassIsComponent = (node: TSESTree.ClassDeclaration): boolean => {
  const superClass = node.superClass;
  if (!superClass) return false;
  if (superClass.type === 'Identifier') {
    return /Component$/.test(superClass.name);
  }
  if (
    superClass.type === 'MemberExpression' &&
    superClass.property.type === 'Identifier'
  ) {
    return /Component$/.test(superClass.property.name);
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

const varComponentTarget = (
  node: TSESTree.VariableDeclaration,
): TSESTree.Identifier | null => {
  if (node.declarations.length !== 1) return null;
  const decl = node.declarations[0];
  return decl ? pascalId(decl.id) : null;
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
      VariableDeclaration(node) {
        if (!isTopLevel(node)) return;
        const target = varComponentTarget(node);
        if (target) open(target.name, target, false);
      },
      'VariableDeclaration:exit'(node) {
        if (isTopLevel(node) && varComponentTarget(node)) close();
      },
      ClassDeclaration(node) {
        const id = isTopLevel(node) ? pascalId(node.id) : null;
        if (id) open(id.name, id, superclassIsComponent(node));
      },
      'ClassDeclaration:exit'(node) {
        if (isTopLevel(node) && pascalId(node.id)) close();
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
