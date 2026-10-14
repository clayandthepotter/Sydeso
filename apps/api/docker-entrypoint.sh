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
until node packages/db/node_modules/prisma/build/index.js migrate deploy --schema packages/db/prisma/schema.prisma; do
  if [ "$attempt" -ge 5 ]; then
    echo "[sydeso-api] migrations failed after $attempt attempts, giving up"
    exit 1
  fi
  attempt=$((attempt + 1))
  echo "[sydeso-api] migrations failed, retrying in 10s (attempt $attempt of 5)"
  sleep 10
done

echo "[sydeso-api] starting the API"
exec node apps/api/dist/main.js
