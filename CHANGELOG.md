# Changelog

## 0.3.0

### Minor Changes

- 183c1af: Add changesets for version management, dynamic version read from package.json, repository URL, and improved README.

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog,
and this project aims to follow Semantic Versioning.

## [Unreleased]

## [0.2.0] - 2026-04-26

### Removed

- `language` and `difficulty` fields removed from resources — dropped from DB schema, API, tRPC router, Gemini prompt, and all UI (table columns, sidebar filters, admin form).
- `DifficultyLevel` type removed from `shared/types.ts`.
- `LanguageBadge` and `DifficultyBadge` components are no longer used in the main view.

### Changed

- DB migration `0001`: `ALTER TABLE resources DROP COLUMN language` and `DROP COLUMN difficulty`.
- `facets` tRPC endpoint no longer returns `languages`.
- Gemini analysis prompt simplified — no longer asks for `difficulty` or `language`.

### Added

- Documentation baseline: README, CONTRIBUTING, LICENSE, CHANGELOG, CODE_OF_CONDUCT, and SECURITY files.
- GitHub Actions CI workflow (`ci.yml`): lint, format check, type check, tests, and build on every push/PR to `main`.
- `PUBLIC_ORIGIN` env var documented in `.env.example` and README — required in production for CSRF protection.
- `GITHUB_TOKEN` env var support in `.env.example` and README — optional but raises GitHub API rate limit from 60 to 5 000 req/hour.

### Changed

- `server/services/github.ts`: passes `Authorization: Bearer` header when `GITHUB_TOKEN` is set.
- Added `vercel.json` for zero-config Vercel deployment (React Router 7 native detection).
- README: added Vercel deployment option with env vars reference.

## [0.1.0] - 2026-04-25

### Added

- Initial React Router 7 + React 19 application scaffold.
- tRPC server/client integration with React Query.
- Drizzle ORM setup for Turso/libSQL and migration scaffolding.
- Admin authentication flow with JWT and password-hash validation.
- Resource analysis services for GitHub, npm, and web URLs.
- Unit test suite with Vitest and coverage support.
- Docker multi-stage build for production runtime.
