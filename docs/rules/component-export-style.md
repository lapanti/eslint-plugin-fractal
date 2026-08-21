# fractal/component-export-style

Enforce a consistent export style for a file's own React component.

## Rationale

The Fractal structure names a file after the component it declares, so
`Dashboard/Dashboard.tsx` declares `Dashboard`. Once that mapping holds, the
export style is what decides how every consumer writes its import. Mixing
`export default Dashboard` and `export { Dashboard }` across a codebase makes
imports inconsistent, makes refactoring renames unreliable, and makes
`fractal/component-imports` boundaries harder to read at a glance.

This rule only inspects the component that matches the filename. Files whose
base name is not a component name (`utils.ts`, `api.ts`) are ignored entirely,
as are components that are not exported at all.

This rule is **not** part of `fractal/recommended`, because either style is a
valid house convention. Enable it explicitly to pick one.

## Options

```typescript
type Options = {
  style?: 'named' | 'default'; // default: "named"
};
```

- **`style`** — the export style required for the file's component. With
  `"named"` (the default) a default export is reported; with `"default"` a
  named export is reported.

## Examples

With the default `{ style: "named" }`, in `Dashboard/Dashboard.tsx`.

Incorrect:

```tsx
export default function Dashboard() {
  return <div />;
}
```

Correct:

```tsx
export function Dashboard() {
  return <div />;
}
```

With `{ style: "default" }`, in `Dashboard/Dashboard.tsx`.

Incorrect:

```tsx
export const Dashboard = () => <div />;
```

Correct:

```tsx
const Dashboard = () => <div />;

export default Dashboard;
```

## Fixing

The rule is fixable, but a fix rewrites only the declaring file — it never
updates the files that import the component. Run `--fix` together with an
import codemod, or expect to fix importers by hand. Note that
`fractal/component-imports` accepts both default and named import specifiers,
so it will not flag the mismatch for you.

A fix is skipped whenever it could not be applied safely:

- the rewrite would duplicate an export the file already has,
- it would create a second default export (a syntax error),
- the default export has no name to preserve (`export default () => <div />`)
  or is wrapped (`export default memo(Dashboard)`), or
- the export declares several bindings at once
  (`export const Dashboard = …, helper = …`, `export { Dashboard, helper }`).

In those cases the problem is still reported, just without an automatic fix.

## Known limitations

- **Targeting is by filename, not by JSX analysis.** Any exported binding whose
  name matches the file's base name is treated as the component, even if it is
  not actually a component. This mirrors `fractal/component-imports`.
- **Re-exports are out of scope.** `export { Dashboard } from './other'` and
  `export { Dashboard as default } from './other'` name another module's
  binding, so they are ignored.
- **Unexported components are ignored.** The rule never requires that a
  component be exported, matching `fractal/one-component-per-file`.
- **Only the first offending export is reported** per file, so a file with
  several conflicting exports may need more than one pass.
