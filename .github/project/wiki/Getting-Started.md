# Getting Started

## Requirements

- Node.js 22+
- pnpm 9+
- Docker for local Postgres, Redis, and MinIO

## Install

```bash
pnpm install
pnpm typecheck
pnpm build
```

## Local Infrastructure

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

## Read First

- `README.md`
- `docs/RULES.md`
- `CONTRIBUTING.md`
- `docs/product/roadmap.md`
