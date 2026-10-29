# Desk

Desk is a personal capture and planning app for one user. It runs on Cloudflare.

You type notes into one box. An agent extracts work items, routes them to Linear projects, and proposes time blocks on your calendar. You confirm each block with one tap. Desk also mirrors forwarded corporate invites to Google Calendar and gives a morning brief.

See `HANDOFF.md` for the full design and the rules.

## Status

Build step 1 of 6 is done: the repo, the event schema, the D1 migrations, the fixtures, and the failing scenarios.
The services are stubs. Nothing is deployed.

| Step | Scope | Status |
|---|---|---|
| 1 | Repo, events, migrations, fixtures, scenarios | Done |
| 2 | PWA offline note box and sync (Capture) | Not started |
| 3 | Triage and Linear routing | Not started |
| 4 | Invite forwarding and the mirror calendar | Not started |
| 5 | Time block proposals and the morning brief | Not started |
| 6 | Tauri shell | Not started |

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
| `pnpm test:domain` | Unit tests for `packages/domain` and `packages/testing` |
| `pnpm test:db` | D1 migration tests in the Workers runtime (Miniflare) |
| `pnpm test:features` | The Gherkin scenarios in `features/` |
| `pnpm test:watch` | All projects in watch mode |
| `pnpm typecheck` | TypeScript for Node code and for Workers code |

Expected result today: the domain, testing, and db projects pass. Each scenario fails with `NotBuiltError`, because its service is not built yet. Later steps in a failing scenario can also fail, because the earlier step did not run.

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

## Before deploy

Do not deploy yet. Confirm the items in `HANDOFF.md` under "Items to confirm with the user before deploy".
