# Builds the Sydeso API for Cloudflare Containers (or any Docker host).
# Build context is the repository root: docker build -f apps/api/Dockerfile .

FROM node:22-bookworm-slim AS build
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable
WORKDIR /repo

# Install with only the manifests present so the dependency layer caches across code changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/db/package.json packages/db/
COPY packages/domain/package.json packages/domain/
COPY packages/api-contracts/package.json packages/api-contracts/
RUN pnpm install --frozen-lockfile --filter @sydeso/api... --filter @sydeso/db

COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm --filter @sydeso/db generate && pnpm --filter @sydeso/api build

FROM node:22-bookworm-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production PORT=4000
WORKDIR /repo
COPY --from=build /repo /repo
COPY apps/api/docker-entrypoint.sh /usr/local/bin/sydeso-api
RUN chmod +x /usr/local/bin/sydeso-api

EXPOSE 4000
# Migrations run against DIRECT_URL before the API starts, so the schema and the code always match.
CMD ["sydeso-api"]
