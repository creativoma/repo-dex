# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |
| < 0.1.0 | No        |

## Reporting a Vulnerability

If you find a security vulnerability, please report it privately.

1. Send an email to: security@repodex.local
2. Include a clear description, impact, and reproduction steps.
3. If possible, include a minimal proof of concept and affected files/routes.
4. Do not open a public issue for unpatched vulnerabilities.

## Response Process

- We will acknowledge receipt within 3 business days.
- We will triage and assess severity.
- We will provide an estimated remediation timeline.
- Once fixed, we will coordinate disclosure details with the reporter.

## Security Best Practices for Contributors

- Never commit secrets, API keys, or `.env` values.
- Use least-privilege tokens and rotate credentials periodically.
- Keep dependencies updated and run tests/lint before submitting PRs.
