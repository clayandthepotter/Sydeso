# Sydeso

Sydeso is a multi-tenant SaaS platform for moving software requests through an auditable AI-native delivery workflow.

The product goal is to transform a natural language feature request into verified implementation output through workflow states, immutable artifacts, agent workers, runner execution, and human approvals.

## Status

Sydeso is in early development. The current application includes a buildable monorepo, an initial persistent core loop, a Prisma-backed data model, and runner protocol scaffolding.

## Architecture

- `apps/web` - Next.js web application.
- `apps/api` - NestJS control-plane API.
- `apps/runner` - self-hosted runner process.
- `packages/domain` - shared workflow/domain types and rules.
- `packages/api-contracts` - shared request/response schemas.
- `packages/db` - Prisma schema, migrations, and database package.
- `infra/docker` - local Postgres, Redis, and MinIO services.
- `docs` - product specification and project rules.

## Requirements

- Node.js 22+
- pnpm 9+
- PostgreSQL-compatible database
- Redis
- S3-compatible object storage for future artifact storage

## Development

```bash
pnpm install
pnpm typecheck
pnpm build
```

For local infrastructure:

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

Database commands:

```bash
pnpm db:generate
pnpm db:migrate
```

## Environment

Copy `.env.example` for local service defaults. The database package also supports `packages/db/.env` for Prisma CLI commands.

Never commit real credentials. `.env`, `.env.*`, and package-local env files are ignored by git.

## Open Source

Sydeso is licensed under the MIT License. See `LICENSE`.

Before contributing, read:

- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `AGENTS.md`
- `docs/RULES.md`

## Project Tracking

Current implementation status is tracked in `TODO.md`.
