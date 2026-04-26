# Changesets

This directory manages versioning and changelog generation for RepoDex.

## Workflow

1. After making changes, run `pnpm changeset` and describe what changed.
2. To bump the version and update `CHANGELOG.md`, run `pnpm version-packages`.
3. Commit the result.

> This project uses changesets for version tracking only — it is not published to npm.
