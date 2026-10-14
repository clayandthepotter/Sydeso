# Deployment

Sydeso runs on Cloudflare next to the marketing site:

| Piece | Where | Hostname |
| --- | --- | --- |
| Marketing site (`sydeso-site` repo) | Workers, static assets | `sydeso.com` |
| Product web app (`apps/web`) | Workers via vinext | `app.sydeso.com` |
| Control-plane API (`apps/api`) | Cloudflare Containers behind a Worker | `api.sydeso.com` |
| Postgres | Supabase | pooler host |
| Artifact object storage | R2 bucket `sydeso-artifacts` | S3 API |
| Runners (`apps/runner`) | Self-hosted by each organization | n/a |

Browsers only ever talk to `app.sydeso.com`. The web Worker calls the API server-side with
`SYDESO_API_URL` and keeps the session token in its own httpOnly cookie.

## Web app (`apps/web`)

Configured by `apps/web/wrangler.jsonc` and `apps/web/vite.config.ts`.

```bash
pnpm --filter @sydeso/web run build:vinext     # builds dist/ for the Workers runtime
pnpm --filter @sydeso/web run start:vinext     # runs it locally with wrangler dev
pnpm --filter @sydeso/web run deploy:vinext    # deploys sydeso-app to Cloudflare
```

Deploying needs `CLOUDFLARE_API_TOKEN` (Edit Cloudflare Workers template) in the environment.
The custom domain `app.sydeso.com` is created on first deploy, including its DNS record.

Workers Builds (deploy on push from GitHub) settings for the `sydeso-app` Worker:

- Root directory: `apps/web`
- Build command: `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @sydeso/web run build:vinext`
- Deploy command: `pnpm run deploy:vinext`

## API (`apps/api`)

The API is a NestJS process built into one file (`pnpm --filter @sydeso/api build` runs Nest
with webpack so the workspace packages are inlined) and shipped as a container image from
`apps/api/Dockerfile`. `apps/api/wrangler.jsonc` defines the `sydeso-api` Worker, the
container, and the `api.sydeso.com` custom domain. `apps/api/worker/index.ts` forwards every
request to one container instance and passes secrets through as environment variables.

On start the container runs `prisma migrate deploy` against `DIRECT_URL`, then listens on 4000.

Requirements:

- The Cloudflare account needs the **Workers Paid** plan; Containers are not on the free plan.
- Deploying builds the image, so it needs Docker locally or Workers Builds on Cloudflare.

Secrets, set once with `wrangler secret put <NAME>` from `apps/api` (or in the dashboard under
the Worker's settings):

| Secret | Value |
| --- | --- |
| `DATABASE_URL` | Supabase pooler URL, port 6543, `?pgbouncer=true&sslmode=require` |
| `DIRECT_URL` | Supabase direct/session URL, port 5432, `?sslmode=require` |
| `STORAGE_ACCESS_KEY_ID` | R2 API token access key (R2 → Manage API tokens → Object Read & Write on `sydeso-artifacts`) |
| `STORAGE_SECRET_ACCESS_KEY` | The matching secret |

Non-secret values (`WEB_ORIGIN`, `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_REGION`,
`STORAGE_FORCE_PATH_STYLE`) live in `wrangler.jsonc`.

### Rotating a secret

The container reads its environment once, when it starts, so a changed secret is not picked up
by the running instance. Editing a secret in the dashboard also only saves a new Worker
*version*; on this Worker it is not deployed automatically. After changing a secret:

1. Deploy the newest version: `npx wrangler versions list --name sydeso-api`, then
   `npx wrangler versions deploy <version-id>@100% --name sydeso-api -y`
   (`wrangler secret put` deploys on its own and skips this step).
2. Restart the container with a rollout. Either push a commit so Workers Builds redeploys, or
   create a rollout against the current image with the Containers API:
   `POST /accounts/<account>/containers/applications/<app-id>/rollouts` with
   `{"strategy":"rolling","kind":"full_auto","step_percentage":100,"target_configuration":{"image":"<current image>"}}`
   (`npx wrangler containers info <app-id>` prints the app id and image).
3. Confirm `https://api.sydeso.com/api/v1/health` reports `"status":"ok"` and
   `"migrationsPending":false`.

```bash
cd apps/api
npx wrangler deploy            # builds the image with Docker, pushes it, deploys the Worker
npx wrangler deploy --dry-run --containers-rollout=none   # validates the config without Docker
```

Workers Builds settings for the `sydeso-api` Worker:

- Root directory: `apps/api`
- Build command: `cd ../.. && pnpm install --frozen-lockfile`
- Deploy command: `npx wrangler deploy`

## First-time checklist

1. Upgrade the Cloudflare account to Workers Paid.
2. Restore (or create) the Supabase project, set a fresh database password, and note both URLs.
3. Create an R2 API token for `sydeso-artifacts`.
4. Set the four API secrets.
5. Deploy the API, then the web app.
6. Create the first account at `https://app.sydeso.com/sign-up` (self sign-up creates an
   organization with that user as owner), or run `pnpm db:seed` against the production database
   for the development owner.
7. Retire the Vercel project and any old Workers so there is one deployment per piece.

## Local verification

`pnpm build` produces both artifacts. The API bundle runs with `node apps/api/dist/main.js`
given the variables in `apps/api/.env.example`; the web build runs with
`pnpm --filter @sydeso/web run start:vinext --var SYDESO_API_URL:http://127.0.0.1:4000/api/v1`.
