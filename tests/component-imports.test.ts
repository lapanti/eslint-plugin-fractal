import path from 'node:path';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import rule from '../src/rules/component-imports';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ROOT = '/project';
const at = (relative: string): string => path.join(process.cwd(), relative);
const page = `${ROOT}/src/pages/Dashboard/Dashboard.tsx`;

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
});

ruleTester.run('component-imports', rule, {
  valid: [
    {
      name: 'imports a shared component (relative)',
      filename: page,
      code: "import Button from '../../components/Button/Button';",
      options: [{ rootDir: ROOT }],
    },
    {
      name: 'imports a shared component (src-rooted)',
      filename: page,
      code: "import Button from 'src/components/Button/Button';",
      options: [{ rootDir: ROOT }],
    },
    {
      name: 'imports its own child component',
      filename: page,
      code: "import Widget from './dashboard/Widget';",
      options: [{ rootDir: ROOT }],
    },
    {
      name: 'imports a deep descendant in its own branch',
      filename: page,
      code: "import Row from './dashboard/table/Row';",
      options: [{ rootDir: ROOT }],
    },
    {
      name: 'external package import is ignored',
      filename: page,
      code: "import { useState } from 'react';",
      options: [{ rootDir: ROOT }],
    },
    {
      name: 'scoped external package import is ignored',
      filename: page,
      code: "import Button from '@mui/material/Button';",
      options: [{ rootDir: ROOT }],
    },
    {
      name: 'non-component (lowercase) import is ignored',
      filename: page,
      code: "import { formatDate } from '../../utils/date';",
      options: [{ rootDir: ROOT }],
    },
    {
      name: 'namespace import is ignored',
      filename: page,
      code: "import * as Icons from '../Settings/icons';",
      options: [{ rootDir: ROOT }],
    },
    {
      name: 'type-only import (whole declaration) is ignored',
      filename: page,
      code: "import type { SettingsProps } from '../Settings/Settings';",
      options: [{ rootDir: ROOT }],
    },
    {
      name: 'inline type-only specifier is ignored',
      filename: page,
      code: "import { type SettingsProps } from '../Settings/Settings';",
      options: [{ rootDir: ROOT }],
    },
    {
      name: 'a non-component file is not constrained',
      filename: `${ROOT}/src/utils/date.ts`,
      code: "import Whatever from '../../elsewhere/Whatever';",
      options: [{ rootDir: ROOT }],
    },
    {
      name: 'an index file is not constrained',
      filename: `${ROOT}/src/pages/Dashboard/index.tsx`,
      code: "import Whatever from '../../elsewhere/Whatever';",
      options: [{ rootDir: ROOT }],
    },
    {
      name: 'a shared component may import another shared component',
      filename: `${ROOT}/src/components/Card/Card.tsx`,
      code: "import Button from '../Button/Button';",
      options: [{ rootDir: ROOT }],
    },
    {
      name: 'a shared component may import its own child',
      filename: `${ROOT}/src/components/Button/Button.tsx`,
      code: "import Icon from './button/Icon';",
      options: [{ rootDir: ROOT }],
    },
    {
      name: 'alias resolving into the shared dir is allowed',
      filename: page,
      code: "import Button from '@/components/Button/Button';",
      options: [{ rootDir: ROOT, aliases: { '@/': 'src/' } }],
    },
    {
      name: 'custom sharedDir is honoured',
      filename: page,
      code: "import Button from '../../ui/Button/Button';",
      options: [{ rootDir: ROOT, sharedDir: 'src/ui' }],
    },
    {
      name: 'allowAncestorSharedDirs: imports a components folder at its own directory level',
      filename: `${ROOT}/src/app/Fizz.tsx`,
      code: "import Widget from './components/Widget/Widget';",
      options: [{ rootDir: ROOT, allowAncestorSharedDirs: true }],
    },
    {
      name: 'allowAncestorSharedDirs: a deeply nested file reaches a components folder two ancestor levels up',
      filename: `${ROOT}/src/app/fizz/buzz/Buzz.tsx`,
      code: "import Widget from '../../components/Widget/Widget';",
      options: [{ rootDir: ROOT, allowAncestorSharedDirs: true }],
    },
  ],
  invalid: [
    {
      name: 'importing a sibling-branch component',
      filename: page,
      code: "import Settings from '../Settings/Settings';",
      options: [{ rootDir: ROOT }],
      errors: [
        {
          messageId: 'crossBranch',
          data: {
            current: 'Dashboard',
            childDir: 'dashboard',
            sharedDir: 'src/components',
            importPath: '../Settings/Settings',
          },
        },
      ],
    },
    {
      name: 'reaching into another branch child folder',
      filename: page,
      code: "import Widget from '../Reports/reports/Widget';",
      options: [{ rootDir: ROOT }],
      errors: [{ messageId: 'crossBranch' }],
    },
    {
      name: 'default + named where default is a cross-branch component',
      filename: page,
      code: "import Settings, { helper } from '../Settings/Settings';",
      options: [{ rootDir: ROOT }],
      errors: [{ messageId: 'crossBranch' }],
    },
    {
      name: 'root-absolute import outside the shared dir',
      filename: page,
      code: "import Other from '/src/features/Other/Other';",
      options: [{ rootDir: ROOT }],
      errors: [{ messageId: 'crossBranch' }],
    },
    {
      name: 'alias resolving outside the shared dir is flagged',
      filename: page,
      code: "import Settings from '@/pages/Settings/Settings';",
      options: [{ rootDir: ROOT, aliases: { '@/': 'src/' } }],
      errors: [{ messageId: 'crossBranch' }],
    },
    {
      name: 'custom sharedDir: the default components dir is now out of bounds',
      filename: page,
      code: "import Button from '../../components/Button/Button';",
      options: [{ rootDir: ROOT, sharedDir: 'src/ui' }],
      errors: [{ messageId: 'crossBranch' }],
    },
    {
      name: 'default cwd: sibling-branch import flagged without rootDir',
      filename: at('src/pages/Dashboard/Dashboard.tsx'),
      code: "import Settings from '../Settings/Settings';",
      errors: [{ messageId: 'crossBranch' }],
    },
    {
      name: 'allowAncestorSharedDirs off: an ancestor components folder is still flagged',
      filename: `${ROOT}/src/app/Fizz.tsx`,
      code: "import Widget from './components/Widget/Widget';",
      options: [{ rootDir: ROOT }],
      errors: [{ messageId: 'crossBranch' }],
    },
    {
      name: 'allowAncestorSharedDirs on: an unrelated branch is still rejected',
      filename: `${ROOT}/src/app/Fizz.tsx`,
      code: "import Widget from '../other/components/Widget/Widget';",
      options: [{ rootDir: ROOT, allowAncestorSharedDirs: true }],
      errors: [
        {
          messageId: 'crossBranchWithAncestors',
          data: {
            current: 'Fizz',
            childDir: 'fizz',
            sharedDir: 'src/components',
            sharedDirBasename: 'components',
            importPath: '../other/components/Widget/Widget',
          },
        },
      ],
    },
  ],
});
