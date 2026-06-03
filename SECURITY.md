# Security Policy

## Supported Versions

Sydeso is pre-1.0 and under active development. Security fixes are applied to the `main` branch until tagged release support is established.

## Reporting a Vulnerability

Do not open a public GitHub issue for security vulnerabilities.

Report vulnerabilities privately to the repository maintainers through GitHub Security Advisories when available, or by contacting the maintainer listed on the GitHub repository.

Please include:

- Affected component.
- Steps to reproduce.
- Potential impact.
- Suggested mitigation, if known.

## Secret Handling

- Never commit `.env`, `.env.*`, database URLs, runner tokens, API keys, or service credentials.
- Rotate any credentials accidentally shared in logs, issues, pull requests, or chat.
- Keep database credentials server-side only.
