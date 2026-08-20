import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import rule from '../src/rules/one-component-per-file';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
});

ruleTester.run('one-component-per-file', rule, {
  valid: [
    {
      name: 'a single function component',
      code: 'export default function App() { return <div />; }',
    },
    {
      name: 'a non-component helper alongside a component',
      code: 'function helper() { return 1; }\nexport default function App() { return <div />; }',
    },
    {
      name: 'a non-component constant alongside a component',
      code: 'const config = { a: 1 };\nexport function Widget() { return <span />; }',
    },
    {
      name: 'a PascalCase object containing JSX alongside a component',
      code: 'const Button = { render: () => <button /> };\nexport function App() { return <main />; }',
    },
    {
      name: 'PascalCase JSX data alongside a component',
      code: 'const Icon = <svg />;\nconst Items = [<span />];\nconst Config = { icon: <i /> };\nexport function App() { return <main />; }',
    },
    {
      name: 'a non-React class containing JSX alongside a component',
      code: 'class Renderer { render() { return <div />; } }\nexport function App() { return <main />; }',
    },
    {
      name: 'a component and helper in one declaration',
      code: 'const helper = () => 1, App = () => <main />;',
    },
    {
      name: 'only non-component declarations',
      code: 'export function add(a, b) { return a + b; }\nexport const NAME = "x";',
    },
    {
      name: 'a single class component (React.Component)',
      code: 'class App extends React.Component { render() { return <div />; } }',
    },
    {
      name: 'a single class component (bare Component)',
      code: 'class App extends Component { render() { return <div />; } }',
    },
    {
      name: 'a memo-wrapped component',
      code: 'const App = memo(function App() { return <div />; });',
    },
    {
      name: 'a forwardRef-wrapped component',
      code: 'const Button = forwardRef((props, ref) => <button ref={ref} />);',
    },
    {
      name: 'a nested inline component counts as one',
      code: 'export default function App() { const Row = () => <tr />; return <table><Row /></table>; }',
    },
  ],
  invalid: [
    {
      name: 'two function components',
      code: 'function A() { return <div />; }\nfunction B() { return <span />; }',
      errors: [{ messageId: 'multiple', data: { name: 'B' } }],
    },
    {
      name: 'two arrow components',
      code: 'const A = () => <div />;\nexport const B = () => <span />;',
      errors: [{ messageId: 'multiple', data: { name: 'B' } }],
    },
    {
      name: 'two arrow components in one declaration',
      code: 'const A = () => <div />, B = () => <span />;',
      errors: [
        {
          messageId: 'multiple',
          data: { name: 'B' },
          line: 1,
          column: 26,
        },
      ],
    },
    {
      name: 'a class expression component plus a function component',
      code: 'const A = class extends React.Component {};\nfunction B() { return <span />; }',
      errors: [{ messageId: 'multiple', data: { name: 'B' } }],
    },
    {
      name: 'a nested HOC component plus a function component',
      code: 'const A = memo(observer(() => <div />));\nfunction B() { return <span />; }',
      errors: [{ messageId: 'multiple', data: { name: 'B' } }],
    },
    {
      name: 'a type-asserted component plus a function component',
      code: 'const A = (() => <div />) as React.FC;\nfunction B() { return <span />; }',
      errors: [{ messageId: 'multiple', data: { name: 'B' } }],
    },
    {
      name: 'a default component plus a named component',
      code: 'export default function A() { return <div />; }\nexport function B() { return <span />; }',
      errors: [{ messageId: 'multiple', data: { name: 'B' } }],
    },
    {
      name: 'a function component plus a class component',
      code: 'function A() { return <i />; }\nclass B extends React.Component { render() { return <i />; } }',
      errors: [{ messageId: 'multiple', data: { name: 'B' } }],
    },
    {
      name: 'three components report the second and third',
      code: 'const A = () => <i />;\nconst B = () => <i />;\nconst C = () => <i />;',
      errors: [
        { messageId: 'multiple', data: { name: 'B' } },
        { messageId: 'multiple', data: { name: 'C' } },
      ],
    },
  ],
});
