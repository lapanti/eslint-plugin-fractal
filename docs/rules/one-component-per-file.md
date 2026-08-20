# fractal/one-component-per-file

Enforce at most one detected top-level React component per file.

## Rationale

The Fractal structure maps one component to one file (and, when it has
children, one sibling folder). Keeping at most one component per file makes
that mapping unambiguous and keeps import boundaries meaningful. The component
does not need to be exported.

A top-level declaration is treated as a component when it is:

- a named function declaration whose name starts with an uppercase letter and
  whose body contains JSX,
- an uppercase-named variable initialized with a function, arrow function, or
  call-wrapped function whose subtree contains JSX, or
- an uppercase-named class declaration or class expression whose superclass
  name ends in `Component` (`React.Component`, `PureComponent`, ...).

Each declarator is checked independently, including declarations such as
`const A = () => <div />, B = () => <span />`.

The first component is allowed; each additional component is reported.

## Options

This rule has no options.

## Examples

Incorrect:

```tsx
function A() {
  return <div />;
}

function B() {
  return <span />;
}
```

Correct:

```tsx
function helper() {
  return 1; // not a component
}

export default function App() {
  return <div />;
}
```

## Known limitations

- **Nested / inline components are not reported.** A component declared inside
  another component's body counts toward the enclosing component.
- **Call-wrapped components** (`memo`, `forwardRef`, and custom wrappers) are
  recognized syntactically when a function argument contains JSX. Wrapper
  names are not resolved or restricted to known React APIs.
- **Anonymous default exports** (`export default function () {}` and
  `export default () => <div />`) are not counted because they have no name to
  report.
- **Function components must contain JSX syntax.** Components implemented only
  with `React.createElement` or an imported factory are not counted.
- **Class detection is name-based.** Any class whose superclass name ends in
  `Component` is counted, even if it is unrelated to React.
