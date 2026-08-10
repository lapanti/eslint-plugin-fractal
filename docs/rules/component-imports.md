# fractal/component-imports

Enforce Fractal import boundaries: a component may import components only from
the shared components directory or from its own same-named child folder.

## Rationale

In the Fractal structure every component `Foo` owns a sibling folder `foo/`
holding the components used only by `Foo`. Shared, multi-use components live
under `src/components`. A component may therefore import another component from
exactly two places:

- the shared components directory (`src/components` by default), or
- its own child folder (`Foo.tsx` → `./foo/`).

Importing a component from any other branch couples two branches of the tree
and breaks the Fractal shape.

Only **component files** are checked — files whose name is PascalCase
(`Dashboard.tsx`). Files such as `index.tsx`, `date.ts`, or `useThing.ts` are
ignored. Only **component imports** are checked — an import is treated as a
component when its default or named binding is PascalCase and not type-only.

## Options

```ts
type Options = {
  sharedDir?: string; // default: "src/components"
  rootDir?: string; // default: the ESLint cwd
  aliases?: Record<string, string>; // e.g. { "@/": "src/" }
};
```

- **`sharedDir`** — directory that holds shared, multi-use components.
- **`rootDir`** — project root used to resolve `sharedDir` and root-relative
  (`src/...`, `/...`) imports.
- **`aliases`** — prefix map so aliased imports resolve to real paths. Without
  it, an aliased import (e.g. `@/pages/...`) is treated as an external package
  and skipped.

## Examples

Given `src/pages/Dashboard/Dashboard.tsx`:

Incorrect:

```tsx
import Settings from '../Settings/Settings'; // another branch
import Widget from '../Reports/reports/Widget'; // another branch's child
```

Correct:

```tsx
import Button from '../../components/Button/Button'; // shared component
import Widget from './dashboard/Widget'; // own child folder
import { formatDate } from '../../utils/date'; // not a component — ignored
import type { SettingsProps } from '../Settings/Settings'; // type-only — ignored
```

## Known limitations

- **Component detection is name-based.** A PascalCase value import that is not a
  component (for example an imported class or enum) may produce a false
  positive.
- **Type-only exclusion needs a TypeScript-aware parser** to populate
  `importKind`. Under a plain parser, type imports are treated as value imports.
- **Aliases are literal prefixes.** Configure `aliases` for each path alias your
  project uses; unrecognized non-relative specifiers are treated as external.
- **Namespace imports** (`import * as X`) are treated as non-component imports.
