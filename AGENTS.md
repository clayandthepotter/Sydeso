# AGENTS.md

This file gives AI coding agents and human maintainers project-specific instructions.

## First Read

Before making changes, read:

- `private_docs/RULES.md`
- `TODO.md`
- `private_docs/Sydeso Master Specification v1.md`

## Project Goal

Sydeso is a workflow-first SaaS application. The core invariant is:

```txt
Feature Request -> Artifact -> Workflow Run -> Transition -> Job -> Runner -> Output Artifact -> Next Transition
```

Workflow state is the source of truth. Artifacts are the system of record. Agent communication must happen through artifacts, not conversational memory.

## Repository Layout

- `apps/web` - Next.js frontend.
- `apps/api` - NestJS API and workflow control plane.
- `apps/runner` - execution-plane runner process.
- `packages/domain` - shared domain types and workflow rules.
- `packages/api-contracts` - shared validation schemas.
- `packages/db` - Prisma schema, migrations, and database package.
- `infra/docker` - local infrastructure.
- `docs` - product and process documentation.

## Engineering Rules

- Keep code typed and buildable.
- Prefer small, modular services over tightly coupled code.
- Do not hardcode runtime data that should come from configuration or the database.
- Do not commit secrets or local environment files.
- Do not modify applied migrations after they are published.
- Preserve multi-tenant boundaries in every API and data access change.
- Treat workflow transitions, artifacts, jobs, runner state, and audit logs as critical business data.

## Validation

Run these before committing code changes:

```bash
pnpm typecheck
pnpm build
```

For database work:

```bash
pnpm db:generate
pnpm db:migrate
```

## Current Priorities

Follow `TODO.md` in order unless the user explicitly asks to pivot. If a request is not represented in `TODO.md`, add it to the backlog or ask for priority before implementing it.

## Security Notes

- Keep Supabase/Postgres credentials out of Git.
- Keep runner tokens server-side.
- Do not expose database URLs through `NEXT_PUBLIC_*` variables.
- Rotate credentials if they are shared in chat, logs, or issues.
