# Desk

Desk is a capture and planning app by Sydeso. It runs on Cloudflare. It is multi-tenant: one person is one tenant.

You type notes into one box. An agent extracts work items, routes them to Linear projects, and proposes time blocks on your calendar. You confirm each block with one tap. Desk also mirrors forwarded corporate invites to Google Calendar and gives a morning brief.

See `HANDOFF.md` for the full design and the rules.

## Status

Live at https://desk.sydeso.com. Sign-up is invite only.

| Step | Scope | Status |
|---|---|---|
| 1 | Repo, events, migrations, fixtures, scenarios | Done |
| 2 | PWA offline note box and sync, invite sign-up, passkey sign-in | Done, deployed |
| 3 | Triage and Linear routing | Deployed. Needs the Claude key on desk-triage. |
| 4 | Invite forwarding and the mirror calendar | Not started |
| 5 | Time block proposals and the morning brief | Not started |
| 6 | Tauri shell | Not started |

## Connect Linear (step 3)

1. In Linear, make the workflow states **Today**, **Next**, and **Later** in your team.
2. In Linear, open Settings, then Security & access, then Personal API keys. Make a key.
3. In Desk, tap **Linear**, paste the key, and tap **Connect Linear**.

Desk then sends each note to Claude. Each item goes to a Linear project, or to review if Desk is not sure.

## Install on a phone

1. Open the invite link on the phone. Enter your email and name. Tap **Continue**, then **Create passkey**.
2. iPhone (Safari): tap **Share**, then **Add to Home Screen**.
3. Android (Chrome): tap the menu, then **Install app** or **Add to Home screen**.
4. Open Desk from the home screen. Next time, tap **Sign in with a passkey**.

To test offline: turn on airplane mode, open Desk, and save a note. The note shows "On this device". Turn off airplane mode. The note changes to "Synced".

## How events flow

```mermaid
flowchart LR
  PWA[PWA note box] -->|NoteCaptured| BUS[(desk-bus)]
  MAIL[invites@in.sydeso.com] -->|InviteReceived or InviteRejected| BUS
  BUS --> TRIAGE[desk-triage]
  BUS --> PARSER[desk-ingest parser]
  BUS --> PLANNER[desk-planner]
  BUS --> MIRROR[desk-mirror]
  BUS --> SCHED[desk-scheduler]
  TRIAGE -->|ItemsExtracted, ItemRouted, ItemNeedsReview| BUS
  PARSER -->|InviteParsed| BUS
  PLANNER -->|WorkItemCreated| BUS
  MIRROR -->|MirrorEventUpserted, MirrorEventRemoved| BUS
  SCHED -->|TimeBlockProposed| BUS
  BUS --> LOG[(desk-events D1, append only)]
  PLANNER --> LINEAR[Linear]
  MIRROR --> GCAL[Google Calendar]
  SCHED --> GCAL
```

## Requirements

- Node.js 22
- pnpm 9.15 (`corepack enable`)

## Setup

Run all commands in `products/desk`. Desk is its own pnpm workspace. It does not join the Sydeso root workspace.

```bash
cd products/desk
pnpm install
```

## Test commands

| Command | What it runs |
|---|---|
| `pnpm test` | All test projects |
| `pnpm test:domain` | Unit tests for domain, testing, the PWA note box, and capture |
| `pnpm test:db` | D1 migration and desk-api tests in the Workers runtime (Miniflare) |
| `pnpm test:features` | The Gherkin scenarios in `features/` |
| `pnpm test:watch` | All projects in watch mode |
| `pnpm typecheck` | TypeScript for Node, Workers, browser, and service worker code |
| `pnpm build` | Builds the PWA into `apps/web/dist` |

Expected result today: the domain, testing, app, and workers projects pass. The offline capture scenario passes. Each scenario fails with `NotBuiltError`, because its service is not built yet. Later steps in a failing scenario can also fail, because the earlier step did not run.

## Layout

```
apps/
  web/              PWA. Note box ports and stub (build step 2).
  desktop/          Tauri shell (build step 6).
services/
  capture/          Stores NoteCaptured.
  ingestion/        Email Worker and .ics parser.
  triage/           Extracts and routes items.
  planning/         Creates Linear issues.
  scheduling/       Mirror calendar and time blocks.
  gateway/          desk-api, Durable Object, WebSocket.
packages/
  domain/           Pure types, event catalog, envelope, ports, idempotency rules.
  testing/          Fakes for every port, an in memory bus, and fixture loaders.
fixtures/
  notes/            Note text and expected items.
  invites/          .ics files and expected parse results.
migrations/         D1 SQL for desk-events.
features/           Gherkin scenarios, step definitions, and the scenario world.
test/db/            Workers runtime tests for the migrations.
```

## Key design points

- **Event envelope.** Each event has `id`, `type`, `version`, `occurredAt`, `source`, and `payload`. `correlationId` and `causationId` are optional. `createEvent` and `parseEvent` in `packages/domain` check the payload against the catalog schema. The source must be the context that owns the type.
- **Append only log.** D1 triggers block `UPDATE` and `DELETE` on `events`. A duplicate event ID is ignored.
- **Idempotency.** A caused event gets a stable ID from `causedEventId(causeId, type)`. A redelivered cause gives the same ID. The `processed_events` table and `InboxPort` record each consumer and event ID pair.
- **Ports.** `ExtractionPort`, `IssueTrackerPort`, `CalendarPort`, `AvailabilityPort`, `Clock`, `IdGenerator`, `EventStorePort`, `InboxPort`, and `RawStorePort`. Real adapters come with each build step.
- **Config.** `DeskConfig` holds the time zone, the confidence threshold, and the allowed senders. Workers read the values from environment variables. The code has no defaults.

## Run locally

```bash
pnpm build
cd services/gateway
printf 'APP_ORIGIN=http://localhost:8787\nRP_ID=localhost\n' > .dev.vars
npx wrangler d1 migrations apply desk-events --local
npx wrangler dev --port 8787 --local-upstream localhost:8787
```

`--local-upstream` keeps the Origin header at localhost. Without it, the Origin check rejects each request.

Make a local invite, then run the browser test with a virtual passkey:

```bash
node scripts/create-invite.mjs --local --origin http://localhost:8787
node apps/web/e2e/phone-flow.cjs "<join link>" /tmp
```

## Deploy

Ask the user first. The resources are the Workers `desk-api`, `desk-triage`, and `desk-planner`, the D1 database `desk-events`, the R2 bucket `desk-raw`, the AI Gateway `desk-ai` (logs off), and the queues `desk-triage-inbox`, `desk-planner-inbox`, `desk-triage-dlq`, and `desk-planner-dlq`.

Secrets: `DESK_SECRETS_KEY` on `desk-api` and `desk-planner` (the same value), and `ANTHROPIC_API_KEY` on `desk-triage`. Without the Claude key, `desk-triage` keeps notes in the queue and retries every 30 minutes.

```bash
pnpm build
cd services/gateway
npx wrangler d1 migrations apply desk-events --remote
npx wrangler deploy
```

Move `.dev.vars` away before `wrangler deploy`, or it can change local only values.

## Invites

```bash
node scripts/create-invite.mjs --days 7 --note "who it is for"
node scripts/create-invite.mjs --email person@example.com   # only this email can use it
```

An invite works once. The database keeps only its SHA-256 hash.

## Not done yet

- Email one-time codes as a sign-in fallback. This needs a mail sender.
- Account recovery. If you lose all passkeys, make a new invite for now.
- More than one passkey per account.
- Realtime sync between devices (Durable Object). Today the list loads from the server when the app opens.
