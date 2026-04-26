# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog,
and this project aims to follow Semantic Versioning.

## [Unreleased]

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
