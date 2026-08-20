# Maintaining

## One-time repository setup

Complete these steps before merging a release-producing change to `main`.

### npm trusted publishing

In the npm package settings for `eslint-plugin-fractal`, add a trusted
publisher with:

| Field             | Value                   |
| ----------------- | ----------------------- |
| Provider          | GitHub Actions          |
| Organization/user | `lapanti`               |
| Repository        | `eslint-plugin-fractal` |
| Workflow          | `ci.yml`                |
| Environment       | Leave empty             |
| Allowed action    | `npm publish`           |

The release job uses npm OIDC and must not receive an `NPM_TOKEN`. After the
first trusted-publishing release succeeds, revoke the old npm automation token
and set npm publishing access to require two-factor authentication and disallow
tokens.

### GitHub repository settings

1. Create the `automerge-approved` label. Renovate applies it only to stable
   patch/minor development-dependency updates. The approval workflow is
   intentionally fail-closed while the label is absent.
2. Enable private vulnerability reporting, the dependency graph, and Dependabot
   alerts under repository security settings.
3. Protect `main` with pull requests and required CI checks. Require the quality
   and package check, every Node.js and ESLint compatibility matrix entry, and
   the Windows check. Do not require the release job because it runs only after
   pushes to `main`.
4. Block force pushes and branch deletion. Require branches to be current before
   merge when platform automerge is enabled.
5. Protect `v*` tags against deletion or updates. If tag creation is restricted,
   allow the GitHub Actions release identity to create release tags.
6. Dismiss stale bot approvals on existing major Renovate pull requests. Major
   updates remain manual even if they were approved before the label gate was
   introduced.

Confirm the exact required-check names after the first pull request runs the new
matrix; GitHub branch rules match the displayed check names.

## Release flow

1. Merge a reviewed Conventional Commit pull request into `main`.
2. CI runs source checks, package validation, Node.js 22/24/26 compatibility,
   ESLint 8/9/10 compatibility, Windows checks, and a production dependency
   audit.
3. After every gate passes, semantic-release computes the version, updates the
   package only in the release workspace, publishes through npm OIDC, creates
   the Git tag, and creates the GitHub release.

The committed package version remains `0.0.0-development`. Do not manually bump
it. `CHANGELOG.md` is archived history through `0.2.1`; GitHub Releases are the
canonical release notes for newer versions.

## Release semantics

- A bug fix that reports fewer lint errors can be a patch.
- A change that can report new lint errors requires at least a minor release.
- A removed rule or option, changed established contract, or dropped supported
  runtime requires a major release.
- Use a `BREAKING CHANGE:` footer or `!` in the Conventional Commit type for a
  major release.

## Post-release verification

After each release:

1. Confirm the GitHub release and `v*` tag point at the expected `main` commit.
2. Confirm `npm view eslint-plugin-fractal version repository engines` reports
   the intended metadata.
3. Confirm npm displays a provenance attestation.
4. Install the published version in clean ESM and CommonJS projects and run an
   actual ESLint violation.
5. Confirm no release commit changed `package.json`, `package-lock.json`, or
   `CHANGELOG.md` on `main`.

If publishing fails, fix the configuration and rerun the failed workflow. Do
not manually create the semantic-release tag or publish the same version.
