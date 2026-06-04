# Sydeso

Sydeso is a state-driven, AI-native software delivery platform that transforms concepts into verified production outcomes through governed workflows, artifacts, agents, QA, runners, release controls, and project memory.

## Public Project Scope

This repository is the public, source-available core of Sydeso.

It is designed for:

- Local development and collaboration
- Self-hosting for internal/personal use
- Community contribution to the core platform

## Repository Structure

- `apps/web` - Next.js application UI and marketing surface
- `apps/api` - NestJS control-plane API
- `apps/runner` - self-hosted runner process
- `packages/domain` - shared workflow/domain types and rules
- `packages/api-contracts` - shared request/response schemas
- `packages/db` - Prisma schema and migrations
- `infra/docker` - local Postgres, Redis, and MinIO stack
- `docs` - public product, architecture, and contributor documentation

## License

This repository is licensed under the Business Source License 1.1 (`BUSL-1.1`).

Key points:

- Internal/self-hosted production use is permitted under the Additional Use Grant in `LICENSE`.
- Competing hosted/managed/embedded commercial offerings are restricted before the Change Date.
- Change Date: June 1, 2030.
- Change License: GNU Affero General Public License v3.0 (AGPLv3).

Read:

- `LICENSE`
- `LICENSE-FAQ.md`
- `OPEN_CORE.md`
- `COMMERCIAL.md`

## Collaboration and Execution Tracking

GitHub Issues and GitHub Projects are the definitive source of collaboration and execution tracking.

Expected workflow:

Issue -> Project item -> Branch/PR -> Review/checks -> Merge -> Project status update

`TODO.md` remains a local mirror/index of implementation status and should reference the related GitHub issue/project item.

Roadmap, issue seeds, labels, wiki source pages, and sync scripts live in `.github/project`.

GitHub Actions sync this directory to GitHub labels, issues, Projects, wiki pages, and generated roadmap docs.

Changelog and release automation use semantic-release and conventional commits on merges to `main`.

## Development Requirements

- Node.js 22+
- pnpm 9+
- PostgreSQL-compatible database
- Redis
- S3-compatible object storage (MinIO locally)

## Local Setup

```bash
pnpm install
pnpm typecheck
pnpm build
```

Local infrastructure:

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

Database commands:

```bash
pnpm db:generate
pnpm db:migrate
```

## Environment

Copy `.env.example` for local service defaults.

The database package also supports `packages/db/.env` for Prisma CLI commands.

Never commit credentials. `.env`, `.env.*`, and package-local env files are ignored by git.

## Public Documentation

Read these first:

- `docs/RULES.md`
- `docs/product/roadmap.md`
- `docs/vision.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `AGENTS.md`

## Public vs Private Documentation

- Public contributor docs belong in `docs/` and root governance files.
- Internal strategy/planning docs belong in `private_docs/` and are not required for public contribution.
