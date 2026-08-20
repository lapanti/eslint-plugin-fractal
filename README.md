# eslint-plugin-fractal

ESLint plugin that enforces the **Fractal** React application structure.

Two rules keep the component tree honest:

| Rule                                                                     | What it enforces                                                                                                                                                                          |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`fractal/component-imports`](docs/rules/component-imports.md)           | A component may import components **only** from the shared components directory (`src/components` by default) or from its own same‑named child folder (`Dashboard.tsx` → `./dashboard/`). |
| [`fractal/one-component-per-file`](docs/rules/one-component-per-file.md) | A file defines **at most one detected top-level** React component.                                                                                                                        |

Together these produce the Fractal shape: one‑off components branch out from a
single entry point, while multi‑use components live in `src/components` and may
have their own shared sub‑component folders. Based on the
[Fractal app structure](https://hackernoon.com/fractal-a-react-app-structure-for-infinite-scale-4dab943092af).

## Install

```sh
npm install --save-dev eslint-plugin-fractal
```

Requires ESLint `>=8.57` using [flat config](https://eslint.org/docs/latest/use/configure/configuration-files).

## Usage

Enable the recommended preset (turns both rules on as errors):

```js
// eslint.config.js
import fractal from 'eslint-plugin-fractal';

export default [fractal.configs.recommended];
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

See the per‑rule docs for examples and the heuristics/limitations that apply.
`component-imports` checks static ES import declarations; re-exports, dynamic
imports, and CommonJS `require()` calls are outside its scope.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md). In short:

```sh
npm install
npm run check   # typecheck + lint + format:check + tests with coverage
npm run build   # emit dist/ (ESM + CJS + d.ts)
```

## Releasing

Releases are automated with
[semantic-release](https://semantic-release.gitbook.io/): merging
[Conventional Commits](https://www.conventionalcommits.org/) to `main`
determines the next version, publishes to npm, and creates a GitHub release.
Add a GitHub remote and an `NPM_TOKEN` repository secret to enable it.

## License

[MIT](LICENSE) © Lauri Lavanti
