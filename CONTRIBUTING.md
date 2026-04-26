# Contributing

Thank you for your interest in contributing to RepoDex.

## Requirements

- Node.js 20+
- pnpm
- A configured `.env` file (you can start from `.env.example`)

## Development Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Create your local environment file:
   ```bash
   cp .env.example .env
   ```
3. Apply the database schema:
   ```bash
   pnpm db:push
   ```
4. Start the app:
   ```bash
   pnpm dev
   ```

## Branch and Pull Request Workflow

1. Create a branch from `main` with a descriptive name:
   - `feat/<tema>`
   - `fix/<tema>`
   - `chore/<tema>`
2. Keep commits small and focused.
3. Before opening a PR, run local checks:
   ```bash
   pnpm lint
   pnpm test
   pnpm typecheck
   pnpm format:check
   ```
4. Open the PR using `.github/PULL_REQUEST_TEMPLATE.md`.
5. Include functional context, technical impact, and test steps.

## Coding Standards

- Use strict TypeScript and explicit types when they improve clarity.
- Add input validation with zod/tRPC where applicable.
- Do not mix unrelated changes in the same PR.
- Keep components and services small, with clear responsibilities.
- Prefer descriptive names over abbreviations.

## Tests

- Add or update tests for every behavior change.
- Keep tests close to the relevant server modules when possible (`server/**/*.test.ts`).
- Useful commands:
  ```bash
  pnpm test
  pnpm test:watch
  pnpm test:coverage
  ```

## Lint and Formatting

- Run lint checks:
  ```bash
  pnpm lint
  ```
- Auto-fix lint issues:
  ```bash
  pnpm lint:fix
  ```
- Format code:
  ```bash
  pnpm format
  ```

## Security and Secrets

- Never commit keys, tokens, or `.env` values.
- Report vulnerabilities according to `SECURITY.md`.
