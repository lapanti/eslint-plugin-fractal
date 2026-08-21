import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import rule from '../src/rules/component-export-style';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
});

const filename = 'src/pages/Dashboard/Dashboard.tsx';
const errors = [
  { messageId: 'expectedNamed' as const, data: { name: 'Dashboard' } },
];
const defaultErrors = [
  { messageId: 'expectedDefault' as const, data: { name: 'Dashboard' } },
];

ruleTester.run('component-export-style', rule, {
  valid: [
    {
      name: 'named function declaration under the default style',
      filename,
      code: 'export function Dashboard() { return <div />; }',
    },
    {
      name: 'named variable declaration',
      filename,
      code: 'export const Dashboard = () => <div />;',
    },
    {
      name: 'named class declaration',
      filename,
      code: 'export class Dashboard extends Component {}',
    },
    {
      name: 'named export specifier',
      filename,
      code: 'function Dashboard() { return <div />; }\nexport { Dashboard };',
    },
    {
      name: 'a component that is not exported at all',
      filename,
      code: 'function Dashboard() { return <div />; }',
    },
    {
      name: 'a default export that is not the file component',
      filename,
      code: 'const config = 1;\nexport const Dashboard = () => <div />;\nexport default config;',
    },
    {
      name: 'a default-exported literal',
      filename,
      code: 'export const Dashboard = () => <div />;\nexport default 42;',
    },
    {
      name: 'a default-exported object',
      filename,
      code: 'export const Dashboard = () => <div />;\nexport default { a: 1 };',
    },
    {
      name: 'a default-exported function named differently',
      filename,
      code: 'export default function Widget() { return <div />; }',
    },
    {
      name: 'a file whose name is not a component',
      filename: 'src/utils/helpers.ts',
      code: 'export default function helpers() { return 1; }',
    },
    {
      name: 'an all-caps filename that is not a component name',
      filename: 'src/API.ts',
      code: 'export default function api() { return 1; }',
    },
    {
      name: 'a virtual filename',
      filename: '<input>',
      code: 'export default function Dashboard() { return <div />; }',
    },
    {
      name: 'a default re-export from another module',
      filename,
      code: "export { Dashboard as default } from './other';",
    },
    {
      name: 'a type-only default export',
      filename,
      code: 'type Dashboard = number;\nexport type { Dashboard as default };',
    },
    {
      name: 'an inline type-only default export specifier',
      filename,
      code: 'type Dashboard = number;\nexport { type Dashboard as default };',
    },
    {
      name: 'a default export under the default style',
      filename,
      options: [{ style: 'default' as const }],
      code: 'export default function Dashboard() { return <div />; }',
    },
    {
      name: 'an anonymous default export under the default style',
      filename,
      options: [{ style: 'default' as const }],
      code: 'export default () => <div />;',
    },
    {
      name: 'an identifier default export under the default style',
      filename,
      options: [{ style: 'default' as const }],
      code: 'function Dashboard() { return <div />; }\nexport default Dashboard;',
    },
    {
      name: 'an unexported component under the default style',
      filename,
      options: [{ style: 'default' as const }],
      code: 'function Dashboard() { return <div />; }',
    },
    {
      name: 'an unrelated named export under the default style',
      filename,
      options: [{ style: 'default' as const }],
      code: 'export function Widget() { return <div />; }\nexport const other = 1;',
    },
    {
      name: 'a type-only named export under the default style',
      filename,
      options: [{ style: 'default' as const }],
      code: 'type Dashboard = number;\nexport type { Dashboard };',
    },
  ],
  invalid: [
    {
      name: 'default-exported function declaration',
      filename,
      code: 'export default function Dashboard() { return <div />; }',
      output: 'export function Dashboard() { return <div />; }',
      errors,
    },
    {
      name: 'default-exported async function declaration',
      filename,
      code: 'export default async function Dashboard() { return <div />; }',
      output: 'export async function Dashboard() { return <div />; }',
      errors,
    },
    {
      name: 'default-exported class declaration',
      filename,
      code: 'export default class Dashboard extends Component {}',
      output: 'export class Dashboard extends Component {}',
      errors,
    },
    {
      name: 'default export of a local identifier',
      filename,
      code: 'function Dashboard() { return <div />; }\nexport default Dashboard;',
      output: 'function Dashboard() { return <div />; }\nexport { Dashboard };',
      errors,
    },
    {
      name: 'default export through a sole specifier',
      filename,
      code: 'function Dashboard() { return <div />; }\nexport { Dashboard as default };',
      output: 'function Dashboard() { return <div />; }\nexport { Dashboard };',
      errors,
    },
    {
      name: 'default export through a string-named specifier',
      filename,
      code: 'function Dashboard() { return <div />; }\nexport { Dashboard as "default" };',
      output: 'function Dashboard() { return <div />; }\nexport { Dashboard };',
      errors,
    },
    {
      name: 'default export alongside another specifier',
      filename,
      code: 'function Dashboard() { return <div />; }\nfunction helper() { return 1; }\nexport { Dashboard as default, helper };',
      output:
        'function Dashboard() { return <div />; }\nfunction helper() { return 1; }\nexport { Dashboard, helper };',
      errors,
    },
    {
      name: 'anonymous arrow default export',
      filename,
      code: 'export default () => <div />;',
      output: null,
      errors,
    },
    {
      name: 'anonymous function default export',
      filename,
      code: 'export default function () { return <div />; }',
      output: null,
      errors,
    },
    {
      name: 'anonymous class default export',
      filename,
      code: 'export default class extends Component {}',
      output: null,
      errors,
    },
    {
      name: 'wrapped default export',
      filename,
      code: 'function Dashboard() { return <div />; }\nexport default memo(Dashboard);',
      output: null,
      errors,
    },
    {
      name: 'type-asserted default export',
      filename,
      code: 'function Dashboard() { return <div />; }\nexport default Dashboard as FC;',
      output: null,
      errors,
    },
    {
      name: 'redundant identifier default export beside a named export',
      filename,
      code: 'function Dashboard() { return <div />; }\nexport { Dashboard };\nexport default Dashboard;',
      output:
        'function Dashboard() { return <div />; }\nexport { Dashboard };\n',
      errors,
    },
    {
      name: 'redundant sole specifier default export beside a named export',
      filename,
      code: 'export function Dashboard() { return <div />; }\nexport { Dashboard as default };',
      output: 'export function Dashboard() { return <div />; }\n',
      errors,
    },
    {
      name: 'default-exported declaration that is also exported by name',
      filename,
      code: 'export default function Dashboard() { return <div />; }\nexport { Dashboard };',
      output: null,
      errors,
    },
    {
      name: 'redundant multi specifier default export beside a named export',
      filename,
      code: 'export function Dashboard() { return <div />; }\nfunction helper() { return 1; }\nexport { Dashboard as default, helper };',
      output: null,
      errors,
    },
    {
      name: 'named function declaration under the default style',
      filename,
      options: [{ style: 'default' as const }],
      code: 'export function Dashboard() { return <div />; }',
      output: 'export default function Dashboard() { return <div />; }',
      errors: defaultErrors,
    },
    {
      name: 'named class declaration under the default style',
      filename,
      options: [{ style: 'default' as const }],
      code: 'export class Dashboard extends Component {}',
      output: 'export default class Dashboard extends Component {}',
      errors: defaultErrors,
    },
    {
      name: 'sole variable declarator under the default style',
      filename,
      options: [{ style: 'default' as const }],
      code: 'export const Dashboard = () => <div />;',
      output: 'const Dashboard = () => <div />;\nexport default Dashboard;',
      errors: defaultErrors,
    },
    {
      name: 'multiple variable declarators under the default style',
      filename,
      options: [{ style: 'default' as const }],
      code: 'export const Dashboard = () => <div />, helper = 1;',
      output: null,
      errors: defaultErrors,
    },
    {
      name: 'sole named specifier under the default style',
      filename,
      options: [{ style: 'default' as const }],
      code: 'function Dashboard() { return <div />; }\nexport { Dashboard };',
      output:
        'function Dashboard() { return <div />; }\nexport default Dashboard;',
      errors: defaultErrors,
    },
    {
      name: 'multiple named specifiers under the default style',
      filename,
      options: [{ style: 'default' as const }],
      code: 'function Dashboard() { return <div />; }\nfunction helper() { return 1; }\nexport { Dashboard, helper };',
      output: null,
      errors: defaultErrors,
    },
    {
      name: 'named export beside an unrelated default export',
      filename,
      options: [{ style: 'default' as const }],
      code: 'const config = 1;\nexport function Dashboard() { return <div />; }\nexport default config;',
      output: null,
      errors: defaultErrors,
    },
    {
      name: 'named export beside a specifier default export',
      filename,
      options: [{ style: 'default' as const }],
      code: 'export function Dashboard() { return <div />; }\nexport { Dashboard as default };',
      output: null,
      errors: defaultErrors,
    },
  ],
});
