# fractal/one-component-per-file

Enforce a single React component per file.

## Rationale

The Fractal structure maps one component to one file (and, when it has
children, one sibling folder). Keeping a single component per file makes that
mapping unambiguous and keeps import boundaries meaningful.

A top-level declaration is treated as a component when it is:

- a PascalCase function or arrow/function `const` that renders JSX, or
- a class whose superclass name ends in `Component`
  (`React.Component`, `PureComponent`, ...).

The first component is allowed; each additional component is reported.

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
- **HOC-wrapped components** (`memo`, `forwardRef`) are recognized only when a
  JSX literal appears inside the wrapped function.
- **Anonymous default exports** (`export default function () {}`) are not
  counted, since they have no name to report.
