# Contributing

## Prerequisites

- Node.js `24.10` or newer in the Node 24 line (see `.nvmrc`)
- npm `>=11.5.1`

The published plugin supports Node.js `>=22.14`; development uses Node 24 so
the release toolchain and npm trusted publishing can run locally and in CI.

## Setup

```sh
npm ci
```

## Scripts

| Script                   | Purpose                                                         |
| ------------------------ | --------------------------------------------------------------- |
| `npm run typecheck`      | Type-check with `tsc --noEmit`.                                 |
| `npm run lint`           | Lint TypeScript, rule metadata/tests, and Node compatibility.   |
| `npm run format`         | Format the repository with Prettier.                            |
| `npm run format:check`   | Verify formatting without writing.                              |
| `npm test`               | Run the Vitest suite once.                                      |
| `npm run test:watch`     | Run Vitest in watch mode.                                       |
| `npm run test:coverage`  | Run tests with V8 coverage and thresholds.                      |
| `npm run verify:package` | Build and verify ESM, CJS, types, and packed files.             |
| `npm run check`          | Typecheck + lint + format check + coverage. Run before pushing. |
| `npm run build`          | Bundle `dist/` (ESM + CJS + type declarations) with tsup.       |
| `npm run release`        | Run semantic-release; maintainers and CI only.                  |

## Test coverage

Coverage thresholds are enforced for every source file, not just in aggregate:

| Metric     | Minimum |
| ---------- | ------- |
| Statements | 95%     |
| Branches   | 90%     |
| Functions  | 95%     |
| Lines      | 95%     |

The coverage command emits text, HTML, and `lcov` reports.

## Project layout

```text
src/
  index.ts                     Plugin entry: meta, rules map, recommended config
  rules/
    component-imports.ts       Fractal import-boundary rule
    one-component-per-file.ts  Single-component-per-file rule
  utils/
    ast.ts                     Shared AST helpers
    create-rule.ts             Rule factory with canonical documentation URLs
scripts/                       Packed-package and compatibility smoke checks
tests/                         Vitest + @typescript-eslint/rule-tester suites
docs/rules/                    Per-rule reference documentation
```

## Adding a rule

1. Create `src/rules/<name>.ts` using the shared `createRule` factory. Include a
   name, description, schema descriptions, messages, and default options.
2. Register it in `src/index.ts` under `rules` and in `configs.recommended`.
3. Add `tests/<name>.test.ts` with valid and invalid cases.
4. Add `docs/rules/<name>.md`.

The `tests/plugin.test.ts` invariants check that every registered rule has
complete metadata, a canonical documentation URL, a matching documentation
file, and an exact recommended-config entry.

## Commit conventions

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`,
`fix:`, `test:`, `docs:`, `chore:`, `ci:`. Keep commits small and focused. The
commit types drive automated releases, so use `feat:` and `fix:` deliberately.

Follow ESLint's rule semantic-versioning convention: a fix that reports fewer
errors can be a patch, while a change that can report new errors requires at
least a minor release. Removed behavior or dropped compatibility is breaking.

## Releases

Releases run through [semantic-release](https://semantic-release.gitbook.io/) in
CI on pushes to `main`:

- `fix:` commits publish a patch release, `feat:` a minor, and a
  `BREAKING CHANGE:` footer a major.
- The committed version remains `0.0.0-development`; semantic-release prepares
  the publish version only in the release workspace.
- npm publishing uses OIDC trusted publishing and creates provenance. No
  `NPM_TOKEN` is used.
- GitHub Releases are the canonical release notes. `CHANGELOG.md` is archived
  history through `0.2.1`.

See [MAINTAINING.md](MAINTAINING.md) for repository setup and post-release
verification.
