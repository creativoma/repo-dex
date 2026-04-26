# RepoDex

Web application to index and analyze developer resources (GitHub, npm, and web URLs) with search, tag filters, an admin area, and JWT-based authentication.

## Stack

- React 19 + React Router 7
- TypeScript
- tRPC 11 + TanStack React Query
- Drizzle ORM + Turso/libSQL
- Vitest (unit tests and coverage)
- ESLint + Prettier
- Docker (multi-stage build)

## Requirements

- Node.js 20+
- pnpm
- Turso/libSQL database (remote, or local using `file:./local.db`)

## Development Environment

Use this mode for local coding, testing, and debugging.

### Development Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Create your environment file:
   ```bash
   cp .env.example .env
   ```
3. Generate an admin password hash:
   ```bash
   pnpm gen:password <your-password>
   ```
4. Apply the database schema:
   ```bash
   pnpm db:push
   ```
5. (Optional) Seed data:
   ```bash
   pnpm db:seed
   ```
6. Start the development server:
   ```bash
   pnpm dev
   ```

## Environment Variables

Based on `.env.example` and actual runtime usage in the codebase:

| Variable              | Required         | Description                                                                                                |
| --------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------- |
| `TURSO_URL`           | Yes              | Turso/libSQL URL. For local development you can use `file:./local.db`.                                     |
| `TURSO_AUTH_TOKEN`    | Remote only      | Turso auth token. Not used with `file:` URLs.                                                              |
| `GEMINI_API_KEY`      | Yes              | API key for Gemini-based URL/resource analysis.                                                            |
| `ADMIN_USER`          | Yes              | Single admin username for login.                                                                           |
| `ADMIN_PASSWORD_HASH` | Yes              | Bcrypt hash for the admin password. Generate with `pnpm gen:password`.                                     |
| `JWT_SECRET`          | Yes              | Secret used to sign/verify JWTs. Must be 32+ chars.                                                        |
| `PUBLIC_ORIGIN`       | Yes (production) | Public URL of the app (e.g. `https://repodex.yourdomain.com`). Required for CSRF protection in production. |
| `GITHUB_TOKEN`        | No (recommended) | GitHub Personal Access Token. Raises API rate limit from 60 to 5 000 req/hour.                             |
| `NODE_ENV`            | No               | `development` or `production`.                                                                             |

### Development Notes

- `TURSO_URL` can be `file:./local.db` for local development.
- `NODE_ENV` is typically `development` when running `pnpm dev`.
- `PUBLIC_ORIGIN` is optional locally unless you test CSRF/origin restrictions, but **required in production**.
- `GITHUB_TOKEN` is optional but strongly recommended. Without it, the GitHub API is limited to 60 unauthenticated requests per hour. Generate a token with no scopes at <https://github.com/settings/tokens>.

## Scripts

- `pnpm dev`: start app in development mode
- `pnpm build`: create production build
- `pnpm start`: serve `build/server/index.js`
- `pnpm typecheck`: generate route types and run `tsc`
- `pnpm db:push`: apply Drizzle schema to the database
- `pnpm db:studio`: open Drizzle Studio
- `pnpm db:seed`: seed test/sample data
- `pnpm gen:password <password>`: generate bcrypt hash for `.env`
- `pnpm test`: run tests once
- `pnpm test:watch`: run tests in watch mode
- `pnpm test:coverage`: run tests with coverage
- `pnpm lint`: run lint checks
- `pnpm lint:fix`: auto-fix lint issues
- `pnpm format`: format code
- `pnpm format:check`: validate formatting

## Testing

Main commands:

```bash
pnpm test
pnpm test:coverage
```

Current tests cover authentication, URL type detection, and server-side services in `server/**/*.test.ts`.

## Production Environment

Use this mode for deployed runtime environments.

### Production Requirements

- Set all required environment variables with production-safe values.
- Use a strong random `JWT_SECRET` (32+ characters).
- Use a remote Turso/libSQL instance and configure `TURSO_AUTH_TOKEN`.
- Set `NODE_ENV=production`.
- Set `PUBLIC_ORIGIN` to the public URL of your app.

### Deployment

### Option 1: Node runtime

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

The server listens on port `3000` by default. Set `PORT` in your platform if needed.

### Option 2: Docker

```bash
docker build -t repodex .
docker run --rm -p 3000:3000 --env-file .env repodex
```

The `Dockerfile` uses a multi-stage Node 20 Alpine build and runs `react-router-serve`.

### Option 3: Vercel

Connect the GitHub repository in the Vercel dashboard. Vercel detects React Router 7 automatically via `react-router.config.ts` and `vercel.json`.

Set the following environment variables in the Vercel project settings:

| Variable              | Notes                                                 |
| --------------------- | ----------------------------------------------------- |
| `TURSO_URL`           | Remote Turso URL (`libsql://...`)                     |
| `TURSO_AUTH_TOKEN`    | Turso auth token                                      |
| `GEMINI_API_KEY`      | Gemini API key                                        |
| `ADMIN_USER`          | Admin username                                        |
| `ADMIN_PASSWORD_HASH` | Generated with `pnpm gen:password`                    |
| `JWT_SECRET`          | Random 32+ char string                                |
| `PUBLIC_ORIGIN`       | Your Vercel domain, e.g. `https://repodex.vercel.app` |
| `GITHUB_TOKEN`        | Optional — raises GitHub API rate limit               |

No additional packages or adapters are required.

## Operational Notes

- Do not commit secrets to the repository.
- If you use remote Turso, validate connectivity and token before running `db:push`.
- Treat `build/` and `coverage/` as generated artifacts, not source of truth.
