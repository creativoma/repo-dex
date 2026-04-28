# Changelog

## [0.4.3] - 2026-04-28

### Added

- Tag facets now include usage counts and a popularity sort.
- Category facets and category filter support in the resources list.
- Active filter summary chips with one-click removal.
- Clear controls for search and category filters.

### Changed

- Empty and loading states now give clearer guidance and status messaging.
- Sorting header uses an accessible button control.
- Mobile and desktop stats now show "X of Y" consistently.
- Dependency updates (tRPC, React Query, TypeScript ESLint, Prettier Tailwind plugin).

### Fixed

- Filter and tag controls now expose pressed state for accessibility.

## [0.4.2] - 2026-04-27

### Added

- Mobile-first layout: dedicated mobile view (< 768px) with brand header, full-width search, resource cards, and a two-row footer showing resource count, credits, and GitHub link.
- Mobile view uses the existing `ResourceCard` component — no table on small screens.

## [0.4.1] - 2026-04-27

### Added

- Tag search input in the sidebar — filter visible tags by keyword in real time.
- Resource search moved to the title bar, inline next to "Catalog".

### Fixed

- Orphaned tags (tags no longer referenced by any resource) are now deleted after a resource is deleted or updated.
- React Query `staleTime` added to `facets` (5 min) and `list` (2 min) queries to reduce unnecessary Turso reads.

## [0.4.0] - 2026-04-26

### Added

- `formatRelativeTime()` utility in `app/lib/formatDate.ts` — converts timestamps to human-readable strings (e.g. "3d ago", "2w ago").
- "Updated" column in the resources table showing relative time since last update, with server-side sorting support.
- `updatedAt` added as a valid sort column in the tRPC router schema.

### Fixed

- Seed data now generates realistic `updatedAt` values after `createdAt` instead of always using the current timestamp.

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
