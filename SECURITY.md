# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in RepoDex, please email **ma.marianoalvarez@gmail.com** with:

- Description of the vulnerability
- Steps to reproduce (if applicable)
- Potential impact
- Your suggested fix (if available)

**Please do not** open a public GitHub issue for security vulnerabilities. This allows us to patch the issue before public disclosure.

## Security Best Practices

When deploying RepoDex:

1. **Environment Variables**: Never commit `.env` files. Always use secure secret management (Vercel secrets, environment variable services, etc.)
2. **JWT Secret**: Use a cryptographically secure random string (32+ characters). Generate with: `openssl rand -base64 32`
3. **Admin Credentials**: Use a strong password. Hash it with `pnpm gen:password <password>`
4. **GitHub Token** (optional): Use a PAT with no scopes for read-only access
5. **HTTPS**: Always deploy with HTTPS in production
6. **CSRF Protection**: Set `PUBLIC_ORIGIN` to your exact domain URL
7. **Database**: Use Turso or other managed databases. Keep `TURSO_AUTH_TOKEN` secure

## Dependencies

This project uses:

- **Node.js 20+ Alpine** (Docker)
- **React 19** with SSR
- **Drizzle ORM** with Turso/libSQL
- **tRPC 11** for type-safe APIs
- **Google Gemini API** for AI analysis

Keep dependencies updated with `pnpm update` and monitor for security advisories.

## Scope

RepoDex is a **self-hosted indexing application**. Security considerations:

- Data is stored in your own database
- API keys are under your control
- No user tracking or telemetry
- No external data sharing (except Gemini API for analysis)

For questions or concerns, reach out: **ma.marianoalvarez@gmail.com**
