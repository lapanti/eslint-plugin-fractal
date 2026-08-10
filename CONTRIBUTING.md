# Contributing

## Prerequisites

- Node.js `>=18.18` (matches the `engines` field)
- npm

## Setup

```sh
npm install
```

## Scripts

| Script                  | Purpose                                                         |
| ----------------------- | --------------------------------------------------------------- |
| `npm run typecheck`     | Type-check with `tsc --noEmit`.                                 |
| `npm run lint`          | Lint sources with ESLint + typescript-eslint.                   |
| `npm run format`        | Format the repository with Prettier.                            |
| `npm run format:check`  | Verify formatting without writing.                              |
| `npm test`              | Run the Vitest suite once.                                      |
| `npm run test:watch`    | Run Vitest in watch mode.                                       |
| `npm run test:coverage` | Run tests with V8 coverage and thresholds.                      |
| `npm run check`         | Typecheck + lint + format check + coverage. Run before pushing. |
| `npm run build`         | Bundle `dist/` (ESM + CJS + type declarations) with tsup.       |

## Project layout

```text
src/
  index.ts                     Plugin entry: meta, rules map, recommended config
  rules/
    component-imports.ts       Fractal import-boundary rule
    one-component-per-file.ts  Single-component-per-file rule
  utils/ast.ts                 Shared helpers
tests/                         Vitest + @typescript-eslint/rule-tester suites
docs/rules/                    Per-rule reference documentation
```

## Adding a rule

1. Create `src/rules/<name>.ts` using
   `ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({ ... })`.
2. Register it in `src/index.ts` under `rules` and in `configs.recommended`.
3. Add `tests/<name>.test.ts` with valid and invalid cases.
4. Add `docs/rules/<name>.md`.

The `tests/plugin.test.ts` invariants check that every registered rule has
complete meta and a matching documentation file, so the suite fails if a step
is missed.

## Commit conventions

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`,
`fix:`, `test:`, `docs:`, `chore:`, `ci:`. Keep commits small and focused. The
commit types drive automated releases, so use `feat:` and `fix:` deliberately.

## Releases

Releases run through [semantic-release](https://semantic-release.gitbook.io/) in
CI on pushes to `main`:

- `fix:` commits publish a patch release, `feat:` a minor, and a
  `BREAKING CHANGE:` footer a major.
- The version, `CHANGELOG.md`, npm publish, and GitHub release are all handled
  automatically.
- Enable it by adding a GitHub remote and an `NPM_TOKEN` repository secret.
