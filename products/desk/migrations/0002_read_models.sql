-- Read models. Projections build these tables from the event log.
-- Each table has one owner context. Other contexts do not read or write it.
-- last_event_id is the event that last changed the row.

-- Owner: capture. Notes are immutable.
CREATE TABLE notes (
  note_id      TEXT PRIMARY KEY,
  text         TEXT NOT NULL,
  captured_at  TEXT NOT NULL,
  device_id    TEXT,
  raw_key      TEXT,
  last_event_id TEXT NOT NULL
);

CREATE INDEX notes_captured_at ON notes (captured_at);

-- Owner: triage.
CREATE TABLE items (
  item_id          TEXT PRIMARY KEY,
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
  last_event_id    TEXT NOT NULL
);

CREATE INDEX items_source_note ON items (source_note_id);
CREATE INDEX items_state_priority ON items (linear_state, priority);

-- Owner: triage. Items and invites that need a human decision.
CREATE TABLE review_queue (
  review_id     TEXT PRIMARY KEY,
  source_kind   TEXT NOT NULL CHECK (source_kind IN ('note', 'invite')),
  source_id     TEXT NOT NULL,
  item_id       TEXT,
  reason        TEXT NOT NULL,
  detail        TEXT CHECK (detail IS NULL OR json_valid(detail)),
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at    TEXT NOT NULL,
  last_event_id TEXT NOT NULL
);

CREATE INDEX review_queue_status ON review_queue (status, created_at);

-- Owner: scheduling. One row per invite. The iCalUID is the dedupe key.
-- Only time, duration, and a short title. Never confidential details.
CREATE TABLE mirror_events (
  ical_uid          TEXT PRIMARY KEY,
  sequence          INTEGER NOT NULL CHECK (sequence >= 0),
  calendar_event_id TEXT NOT NULL,
  title             TEXT NOT NULL,
  start_at          TEXT NOT NULL,
  end_at            TEXT NOT NULL,
  removed           INTEGER NOT NULL DEFAULT 0 CHECK (removed IN (0, 1)),
  last_event_id     TEXT NOT NULL
);

CREATE INDEX mirror_events_start ON mirror_events (start_at);

-- Owner: scheduling. A time block is a proposal until the user confirms it.
CREATE TABLE time_blocks (
  time_block_id     TEXT PRIMARY KEY,
  item_id           TEXT NOT NULL,
  start_at          TEXT NOT NULL,
  end_at            TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'confirmed', 'rejected')),
  calendar_event_id TEXT,
  last_event_id     TEXT NOT NULL,
  -- A calendar event exists only for a confirmed block.
  CHECK ((status = 'confirmed') = (calendar_event_id IS NOT NULL))
);

CREATE INDEX time_blocks_status_start ON time_blocks (status, start_at);
