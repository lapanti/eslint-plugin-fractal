# eslint-plugin-fractal

ESLint plugin that enforces the **Fractal** React application structure.

Two rules keep the component tree honest:

| Rule                                                                     | What it enforces                                                                                                                                                                          |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`fractal/component-imports`](docs/rules/component-imports.md)           | A component may import components **only** from the shared components directory (`src/components` by default) or from its own same‑named child folder (`Dashboard.tsx` → `./dashboard/`). |
| [`fractal/one-component-per-file`](docs/rules/one-component-per-file.md) | A file defines **at most one detected top-level** React component.                                                                                                                        |

And one opt-in rule for teams that want a single export convention:

| Rule                                                                     | What it enforces                                                                                                             |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| [`fractal/component-export-style`](docs/rules/component-export-style.md) | A file's own component is exported consistently, either as a **named** export (default) or as a **default** export. Fixable. |

Together these produce the Fractal shape: one‑off components branch out from a
single entry point, while multi‑use components live in `src/components` and may
have their own shared sub‑component folders. Based on the
[Fractal app structure](https://hackernoon.com/fractal-a-react-app-structure-for-infinite-scale-4dab943092af).

## Install

```sh
npm install --save-dev eslint-plugin-fractal
```

Requires Node.js `>=22.14` and ESLint `8.57`, `9`, or `10` using
[flat config](https://eslint.org/docs/latest/use/configure/configuration-files).

## Usage

Enable the recommended preset (turns both structural rules on as errors):

```js
// eslint.config.js
import fractal from 'eslint-plugin-fractal';

export default [fractal.configs.recommended];
```

CommonJS flat configs receive the plugin directly, without a `.default`
property:

```js
// eslint.config.cjs
const fractal = require('eslint-plugin-fractal');

module.exports = [fractal.configs.recommended];
```

Or wire the rules up yourself, scoped to your components, with options:

```js
// eslint.config.js
import fractal from 'eslint-plugin-fractal';

export default [
  {
    files: ['src/**/*.{jsx,tsx}'],
    plugins: { fractal },
    rules: {
      'fractal/component-imports': [
        'error',
        {
          sharedDir: 'src/components',
          aliases: { '@/': 'src/' },
        },
      ],
      'fractal/one-component-per-file': 'error',
    },
  },
];
```

`fractal/component-export-style` is not part of the recommended preset. Add it
explicitly if you want one export convention enforced:

```js
rules: {
  'fractal/component-export-style': ['error', { style: 'named' }],
}
```

> The plugin does not configure a parser. Use a parser that understands
> JSX/TSX — for example [`typescript-eslint`](https://typescript-eslint.io/) —
> or espree with `languageOptions.parserOptions.ecmaFeatures.jsx = true`.

### `component-imports` options

| Option                    | Type                    | Default            | Purpose                                                                                                            |
| ------------------------- | ----------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `sharedDir`               | `string`                | `"src/components"` | Shared component directory, resolved from `rootDir` unless absolute.                                               |
| `rootDir`                 | `string`                | ESLint cwd         | Project root for shared and root-relative imports; relative values resolve from the ESLint cwd.                    |
| `aliases`                 | `Record<string,string>` | `{}`               | Nonempty literal prefixes matched longest-first, e.g. `{ "@/": "src/" }`.                                          |
| `allowAncestorSharedDirs` | `boolean`               | `false`            | Also allow importing from a same‑named folder (e.g. `components`) at any ancestor directory, not just `sharedDir`. |

TypeScript consumers can import `ComponentImportsOption` for the option object
or `ComponentImportsOptions` for ESLint's options tuple from the package root.

### `component-export-style` options

| Option  | Type                   | Default   | Purpose                                                           |
| ------- | ---------------------- | --------- | ----------------------------------------------------------------- |
| `style` | `"named" \| "default"` | `"named"` | Export style required for the component matching the file's name. |

TypeScript consumers can import `ComponentExportStyleOption` or
`ComponentExportStyleOptions` from the package root.

The rule is fixable, but `--fix` rewrites only the declaring file and never the
files importing it. See the
[rule docs](docs/rules/component-export-style.md) for the cases where a fix is
deliberately skipped.

See the per‑rule docs for examples and the heuristics/limitations that apply.
`component-imports` checks static ES import declarations; re-exports, dynamic
imports, and CommonJS `require()` calls are outside its scope.

### Monorepos

Use one flat-config block per package when packages have independent Fractal
roots. Relative `rootDir` values resolve from the ESLint working directory:

```js
{
  files: ['packages/app/src/**/*.{jsx,tsx}'],
  plugins: { fractal },
  rules: {
    'fractal/component-imports': ['error', {
      rootDir: 'packages/app',
      sharedDir: 'src/components',
      aliases: { '@app/': 'src/' },
    }],
    'fractal/one-component-per-file': 'error',
  },
}
```

## Versioning

This package follows [semantic versioning](https://semver.org/), interpreted
the way ESLint interprets it for linting tools:

| Change                                                                                           | Release |
| ------------------------------------------------------------------------------------------------ | ------- |
| A fix that makes a rule report **fewer** problems                                                | patch   |
| A new rule, a new option, or a change that can report **new** problems                           | minor   |
| Removing a rule or option, changing a default, or dropping a supported Node.js or ESLint version | major   |

A minor release can therefore surface lint errors that a previous version did
not report. Pin the version if your build treats new lint errors as failures.

New rules are added outside `fractal/recommended` when they encode a style
preference rather than the Fractal structure, so extending `recommended` does
not start reporting a convention you have not opted into.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md). In short:

```sh
npm ci
npm run check   # typecheck + lint + format:check + tests with coverage
npm run verify:package   # ESM + CJS + types + packed-file validation
```

## Releasing

Releases are automated with
[semantic-release](https://semantic-release.gitbook.io/): merging
[Conventional Commits](https://www.conventionalcommits.org/) to `main`
determines the next version, publishes to npm, and creates a GitHub release.
Publishing uses npm trusted publishing through GitHub Actions; no npm token is
stored in the repository. See [MAINTAINING.md](MAINTAINING.md) for one-time
configuration and release verification. GitHub Releases are the canonical
release notes.

## License

[MIT](LICENSE) © Lauri Lavanti
