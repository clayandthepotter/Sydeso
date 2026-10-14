#!/bin/sh
# Container entrypoint: apply pending migrations, then start the API.
# Everything runs through node directly so the image needs no package manager at runtime.
set -u
cd /repo

echo "[sydeso-api] node $(node -v), port ${PORT:-4000}"

# Show whether the database host resolves; the URL itself is never printed.
db_host=$(node -e 'try { console.log(new URL(process.env.DIRECT_URL || "").hostname) } catch { console.log("") }')
if [ -n "$db_host" ]; then
  if getent hosts "$db_host" >/dev/null 2>&1; then
    echo "[sydeso-api] database host $db_host resolves"
  else
    echo "[sydeso-api] database host $db_host does not resolve"
  fi
else
  echo "[sydeso-api] DIRECT_URL is not set"
fi

attempt=1
migrated=0
until node packages/db/node_modules/prisma/build/index.js migrate deploy --schema packages/db/prisma/schema.prisma; do
  if [ "$attempt" -ge 3 ]; then
    break
  fi
  attempt=$((attempt + 1))
  echo "[sydeso-api] migrations failed, retrying in 10s (attempt $attempt of 3)"
  sleep 10
done
if [ "$attempt" -lt 3 ] || node packages/db/node_modules/prisma/build/index.js migrate status --schema packages/db/prisma/schema.prisma >/dev/null 2>&1; then
  migrated=1
fi

# The API starts either way so the health endpoint can report the database state instead of
# the container silently exiting; requests that need the database fail until it is reachable.
if [ "$migrated" -eq 1 ]; then
  echo "[sydeso-api] migrations applied, starting the API"
else
  echo "[sydeso-api] migrations could not be applied, starting the API in degraded mode"
  export SYDESO_MIGRATIONS_PENDING=1
fi
exec node apps/api/dist/main.js
