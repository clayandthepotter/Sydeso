# Desk: Handoff for Claude Code

## Goal

Build Desk. Desk is a personal capture and planning app for one user (Clayton).

The user types unstructured notes into one box. An agent extracts work items, routes each item to the correct Linear project, and proposes calendar time blocks. The user confirms with one tap.

Desk must also:
- Never miss a meeting. Show a morning brief with prep notes.
- Mirror corporate calendar invites into Google Calendar.
- Work offline. Notes are captured in meetings with poor connections.

## Locked decisions

- One user. One tenant. Time zone: America/La_Paz (UTC-04:00).
- Platform: Cloudflare only. The account is paid. Domain: `sydeso.com`.
- Client: one web app. It is installed as a PWA on Windows and phone.
- Windows wrapper: Tauri. It adds only a global hotkey, tray icon, autostart, and single instance. The wrapper has no business logic. Build it last.
- Task system of record: Linear.
- Calendar the agent reads: the user's unified Google calendar. It subscribes to the user's other Google calendars.
- Corporate calendars cannot be subscribed or published (company security). The only way in is forwarded invites. Mirror them to a "Corporate Mirror" Google calendar. The unified calendar subscribes to that calendar.
- The agent writes time blocks to its own "Desk Focus Blocks" Google calendar. The unified calendar subscribes to it.
- LLM: Claude API, called through Cloudflare AI Gateway.
- Auth: Cloudflare Access. Allow only the user's email.

## Name and isolation rules

The account has other services. Do not touch them.

Existing resources (do not read, write, or reuse):
- Workers: `sydeso-api`, `sydeso-app`, `sydeso-site`, `sydeso-site-dev`, `sydeso-proposals`, `sydeso`, `personal-site`
- KV: `INBOX`, `dev-INBOX`, `BLOG`, `dev-BLOG`
- R2: `capca-recordings`, `photodrone`, `sydeso-artifacts`, `sydeso-site-media`, `sydeso-site-media-dev`
- D1: none exist

Rules for Desk:
- Prefix every resource with `desk-`. Examples: `desk-api`, `desk-ingest`, `desk-triage`, `desk-events` (D1), `desk-raw` (R2), `desk-bus` (Queue).
- App and API host: `desk.sydeso.com`. Do not use `api.sydeso.com` or `app.sydeso.com`.
- Inbound email host: `in.sydeso.com`. Addresses: `invites@in.sydeso.com` and `notes@in.sydeso.com`.
- Never enable Email Routing on the root domain. It replaces MX records and can stop existing mail.
- Use a separate Access policy for `desk.sydeso.com`.

## Items to confirm with the user before deploy

1. The `sydeso.com` zone is on this Cloudflare account.
2. `in.sydeso.com` has no MX records today.
3. Company policy allows forwarding invites to an outside address.
4. The user can set an Outlook auto-forward rule, or must forward by hand.
5. The user approves the name "Desk" and the host `desk.sydeso.com`.

Local development does not need these. Do not block on them.

## Architecture

```
Outlook invite (forwarded)         Note box (PWA / Tauri)
        |                                   |
invites@in.sydeso.com               IndexedDB (client ID)
        |                                   |
Email Worker: check sender          Sync queue (retry safe)
store raw in R2                             |
        |                                   v
        +-----------> desk-bus (Queue) <----+
                           |
      +--------------------+--------------------+
      |                    |                    |
 desk-triage          desk-mirror          desk-planner
 (Claude: extract,    (Google Calendar:    (Linear: create
  route, score)        upsert, remove)      and update issues)
      |                    |                    |
      +---------- desk-events (D1, append only) +
                           |
              Durable Object per user
              WebSocket to PWA and Tauri
                           |
              desk-scheduler: read unified calendar,
              propose time blocks, write on confirm
```

| Need | Service |
|---|---|
| Event log and read models | D1 (`desk-events`) |
| Event bus | Queues (`desk-bus`) |
| Raw notes and raw emails | R2 (`desk-raw`) |
| Realtime sync | Durable Object with WebSockets |
| Inbound email | Email Routing and Email Workers |
| Morning brief and shutdown prompt | Cron Triggers |
| App hosting | Workers static assets |
| LLM calls | AI Gateway |
| Auth | Cloudflare Access |
| OAuth tokens (Google, Linear) | Worker secrets. KV or Durable Object for refresh state. Create a new `desk-` namespace. Do not use `INBOX`. |

## Domain model (DDD)

Five bounded contexts. Each is its own Worker. Contexts share events only. They never share tables.

| Context | Owns | Publishes |
|---|---|---|
| Capture | Raw notes. Notes are immutable. | `NoteCaptured` |
| Ingestion | Raw forwarded emails and parsed invites | `InviteReceived`, `InviteParsed`, `InviteRejected` |
| Triage | Extraction and routing | `ItemsExtracted`, `ItemRouted`, `ItemNeedsReview` |
| Planning | Linear issues | `WorkItemCreated`, `WorkItemUpdated` |
| Scheduling | Availability and time blocks | `MirrorEventUpserted`, `MirrorEventRemoved`, `TimeBlockProposed`, `TimeBlockConfirmed`, `TimeBlockRejected` |

Extracted item fields: action, project, due date, duration, priority (P1, P2, P3), confidence (0 to 1), source note ID.

Ubiquitous language: Note, Item, Work Item, Time Block, Mirror Event, Review Queue, Brief.

## Rules the system must keep

- The event log is append only. Build read models from it.
- Every event has an ID. Every consumer is idempotent on that ID. Queues deliver at least once.
- Notes get their ID on the client. The server ignores duplicate IDs.
- Never guess silently. An item below the confidence threshold goes to the Review Queue.
- Time blocks are proposals. They become calendar events only after the user confirms.
- Allow at most 3 P1 items in Today.
- Linear states used: Today, Next, Later.
- Invite dedupe key: the iCalUID. A higher SEQUENCE replaces the old event. METHOD CANCEL removes the mirror event. Parse failures go to the Review Queue.
- Mirror only time, duration, and a short title (or "Busy"). Never copy confidential invite details. Mark mirror events as Busy.
- Convert invite time zones to America/La_Paz.
- The Email Worker accepts mail only from the user's corporate address. Reject all other senders and write `InviteRejected`.
- Keep each Worker step small (CPU limits). One queue message per step.

## Testing approach

Test first (TDD). Write scenarios first (BDD). Tests drive every change.

- Runner: Vitest with the Cloudflare Workers test pool. It runs D1, Queues, R2, and Durable Objects locally.
- Domain logic is pure functions with no I/O. Test it with unit tests.
- Each context has contract tests for the events it publishes and consumes.
- Use fixtures. Store them in `fixtures/notes/` (note text and expected items) and `fixtures/invites/` (.ics files and expected mirror events). The user will supply real examples later. Start with synthetic ones.
- LLM calls sit behind a port (`ExtractionPort`). Tests use a fake. A small separate eval suite uses the real model.

The starting scenarios are in `features/`.

## Build order

1. Repo, event schema, D1 migrations, fixtures, failing scenarios. **Done.**
2. PWA with offline note box and sync (Capture).
3. Triage and Linear routing.
4. Invite forwarding: Email Worker, parser, mirror calendar.
5. Time block proposals and the morning brief.
6. Tauri shell: global hotkey (Ctrl+Shift+Space), tray, autostart, single instance, quick capture window at `/capture`.

## Working agreements

- Use American English.
- Write comments, docs, and commit messages in short, simple sentences (ASD-STE100 style).
- Do not use em dashes or en dashes anywhere in code comments, docs, UI copy, or commit messages.
- Prefer small commits. One behavior per commit. Tests first.
- Use microservices only where a bounded context needs it. Share nothing except events.
- Ask the user before any deploy, DNS change, or Access policy change.
