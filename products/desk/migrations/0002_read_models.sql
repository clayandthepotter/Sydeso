-- Read models. Projections build these tables from the event log.
-- Each table has one owner context. Other contexts do not read or write it.
-- Every row belongs to one tenant. Keys start with tenant_id.
-- last_event_id is the event that last changed the row.

-- Owner: capture. Notes are immutable. The client sets note_id.
CREATE TABLE notes (
  tenant_id     TEXT NOT NULL,
  note_id       TEXT NOT NULL,
  text          TEXT NOT NULL,
  captured_at   TEXT NOT NULL,
  device_id     TEXT,
  raw_key       TEXT,
  last_event_id TEXT NOT NULL,
  PRIMARY KEY (tenant_id, note_id)
) WITHOUT ROWID;

CREATE INDEX notes_tenant_captured_at ON notes (tenant_id, captured_at);

-- Owner: triage.
CREATE TABLE items (
  tenant_id        TEXT NOT NULL,
  item_id          TEXT NOT NULL,
  source_note_id   TEXT NOT NULL,
  action           TEXT NOT NULL,
  project          TEXT,
  due_date         TEXT,
  duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  priority         TEXT NOT NULL CHECK (priority IN ('P1', 'P2', 'P3')),
  confidence       REAL NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  status           TEXT NOT NULL DEFAULT 'extracted'
                   CHECK (status IN ('extracted', 'routed', 'needs_review', 'created')),
  linear_state     TEXT CHECK (linear_state IS NULL OR linear_state IN ('Today', 'Next', 'Later')),
  issue_id         TEXT,
  issue_key        TEXT,
  last_event_id    TEXT NOT NULL,
  PRIMARY KEY (tenant_id, item_id)
) WITHOUT ROWID;

CREATE INDEX items_tenant_source_note ON items (tenant_id, source_note_id);
CREATE INDEX items_tenant_state_priority ON items (tenant_id, linear_state, priority);

-- Owner: triage. Items and invites that need a human decision.
CREATE TABLE review_queue (
  tenant_id     TEXT NOT NULL,
  review_id     TEXT NOT NULL,
  source_kind   TEXT NOT NULL CHECK (source_kind IN ('note', 'invite')),
  source_id     TEXT NOT NULL,
  item_id       TEXT,
  reason        TEXT NOT NULL,
  detail        TEXT CHECK (detail IS NULL OR json_valid(detail)),
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at    TEXT NOT NULL,
  last_event_id TEXT NOT NULL,
  PRIMARY KEY (tenant_id, review_id)
) WITHOUT ROWID;

CREATE INDEX review_queue_tenant_status ON review_queue (tenant_id, status, created_at);

-- Owner: scheduling. One row per invite per tenant. The iCalUID is the dedupe key.
-- Only time, duration, and a short title. Never confidential details.
CREATE TABLE mirror_events (
  tenant_id         TEXT NOT NULL,
  ical_uid          TEXT NOT NULL,
  sequence          INTEGER NOT NULL CHECK (sequence >= 0),
  calendar_event_id TEXT NOT NULL,
  title             TEXT NOT NULL,
  start_at          TEXT NOT NULL,
  end_at            TEXT NOT NULL,
  removed           INTEGER NOT NULL DEFAULT 0 CHECK (removed IN (0, 1)),
  last_event_id     TEXT NOT NULL,
  PRIMARY KEY (tenant_id, ical_uid)
) WITHOUT ROWID;

CREATE INDEX mirror_events_tenant_start ON mirror_events (tenant_id, start_at);

-- Owner: scheduling. A time block is a proposal until the user confirms it.
CREATE TABLE time_blocks (
  tenant_id         TEXT NOT NULL,
  time_block_id     TEXT NOT NULL,
  item_id           TEXT NOT NULL,
  start_at          TEXT NOT NULL,
  end_at            TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'confirmed', 'rejected')),
  calendar_event_id TEXT,
  last_event_id     TEXT NOT NULL,
  PRIMARY KEY (tenant_id, time_block_id),
  -- A calendar event exists only for a confirmed block.
  CHECK ((status = 'confirmed') = (calendar_event_id IS NOT NULL))
) WITHOUT ROWID;

CREATE INDEX time_blocks_tenant_status_start ON time_blocks (tenant_id, status, start_at);
