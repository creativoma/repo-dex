# RepoDex

A self-hosted web application to index, search, and analyze developer resources — GitHub repos, npm packages, and arbitrary URLs — with AI-powered metadata extraction, tag-based filtering, and a JWT-authenticated admin area.

**Live:** [repo-dex.vercel.app](https://repo-dex.vercel.app) &nbsp;·&nbsp; **Source:** [github.com/creativoma/repo-dex](https://github.com/creativoma/repo-dex)

---

## Architecture

| Layer            | Technology                                  |
| ---------------- | ------------------------------------------- |
| Frontend         | React 19 + React Router 7 (SSR)             |
| API              | tRPC 11 + TanStack React Query              |
| Database         | Drizzle ORM + Turso / libSQL                |
| AI analysis      | Google Gemini                               |
| Auth             | JWT (bcrypt-hashed password, no user table) |
| Styling          | Tailwind CSS v4                             |
| Testing          | Vitest + coverage-v8                        |
| Containerization | Docker (multi-stage, Node 20 Alpine)        |

---

## Getting started

### Prerequisites

- Node.js 20+
- pnpm
- A Turso database (or `file:./local.db` for local-only use)
- A Gemini API key

### Setup

```bash
pnpm install
cp .env.example .env          # fill in the variables below
pnpm gen:password <password>  # prints the bcrypt hash for ADMIN_PASSWORD_HASH
pnpm db:push                  # apply schema
pnpm db:seed                  # optional sample data
pnpm dev
```

The dev server starts at `http://localhost:5173`.

---

## Environment variables

| Variable              | Required    | Description                                                                          |
| --------------------- | ----------- | ------------------------------------------------------------------------------------ |
| `TURSO_URL`           | Yes         | `libsql://…` for remote, `file:./local.db` for local                                 |
| `TURSO_AUTH_TOKEN`    | Remote only | Turso auth token — not used with `file:` URLs                                        |
| `GEMINI_API_KEY`      | Yes         | Used for AI metadata extraction on resource analysis                                 |
| `ADMIN_USER`          | Yes         | Admin username                                                                       |
| `ADMIN_PASSWORD_HASH` | Yes         | bcrypt hash — generate with `pnpm gen:password`                                      |
| `JWT_SECRET`          | Yes         | At least 32 random characters                                                        |
| `PUBLIC_ORIGIN`       | Production  | Full public URL (e.g. `https://repo-dex.example.com`) — required for CSRF protection |
| `GITHUB_TOKEN`        | Recommended | PAT with no scopes — raises GitHub API rate limit from 60 to 5 000 req/h             |
| `NODE_ENV`            | No          | `development` or `production`                                                        |

---

## Scripts

| Command                        | Description                                  |
| ------------------------------ | -------------------------------------------- |
| `pnpm dev`                     | Start dev server with HMR                    |
| `pnpm build`                   | Production build                             |
| `pnpm start`                   | Serve production build                       |
| `pnpm typecheck`               | Generate route types and run `tsc`           |
| `pnpm test`                    | Run test suite                               |
| `pnpm test:coverage`           | Run tests with v8 coverage                   |
| `pnpm lint` / `lint:fix`       | ESLint                                       |
| `pnpm format` / `format:check` | Prettier                                     |
| `pnpm db:push`                 | Apply Drizzle schema                         |
| `pnpm db:studio`               | Open Drizzle Studio                          |
| `pnpm db:migrate`              | Run migration script                         |
| `pnpm db:seed`                 | Seed sample data                             |
| `pnpm gen:password <pw>`       | Generate bcrypt hash for `.env`              |
| `pnpm changeset`               | Open interactive prompt to describe a change |
| `pnpm version-packages`        | Bump version and update `CHANGELOG.md`       |

---

## Versioning

This project uses [Changesets](https://github.com/changesets/changesets) for version management and changelog generation.

```bash
# After making changes worth documenting:
pnpm changeset          # describe the change (patch / minor / major)
pnpm version-packages   # applies the bump and updates CHANGELOG.md
git add . && git commit -m "release: bump version to x.y.z"
```

---

## Deployment

### Node

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start               # listens on port 3000 by default
```

### Docker

```bash
docker build -t repodex .
docker run --rm -p 3000:3000 --env-file .env repodex
```

The `Dockerfile` uses a multi-stage Node 20 Alpine build.

### Vercel

Connect the repository in the Vercel dashboard — React Router 7 is detected automatically via `react-router.config.ts` and `vercel.json`. Set all required environment variables in the project settings. No additional adapters needed.

---

## License

MIT
