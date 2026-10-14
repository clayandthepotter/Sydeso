#!/bin/sh
# Container entrypoint: apply pending migrations, then start the API.
# Everything runs through node directly so the image needs no package manager at runtime.
set -eu
cd /repo

echo "[sydeso-api] applying migrations"
node packages/db/node_modules/prisma/build/index.js migrate deploy --schema packages/db/prisma/schema.prisma

echo "[sydeso-api] starting on port ${PORT:-4000}"
exec node apps/api/dist/main.js
