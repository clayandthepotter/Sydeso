-- The append only event log for Desk.
-- Every context writes its events here. Read models come from this log.
-- Every row belongs to one tenant. Every query must filter on tenant_id.

CREATE TABLE events (
  -- seq gives the append order. id is the event ID from the envelope.
  seq            INTEGER PRIMARY KEY AUTOINCREMENT,
  id             TEXT    NOT NULL UNIQUE,
  tenant_id      TEXT    NOT NULL,
  type           TEXT    NOT NULL,
  version        INTEGER NOT NULL CHECK (version > 0),
  occurred_at    TEXT    NOT NULL,
  source         TEXT    NOT NULL CHECK (source IN ('identity', 'capture', 'ingestion', 'triage', 'planning', 'scheduling')),
  payload        TEXT    NOT NULL CHECK (json_valid(payload)),
  correlation_id TEXT,
  causation_id   TEXT,
  recorded_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX events_tenant_type_seq ON events (tenant_id, type, seq);
CREATE INDEX events_tenant_correlation ON events (tenant_id, correlation_id);

-- The log is append only. Block every UPDATE and DELETE.
CREATE TRIGGER events_no_update BEFORE UPDATE ON events
BEGIN
  SELECT RAISE(ABORT, 'events is append only');
END;

CREATE TRIGGER events_no_delete BEFORE DELETE ON events
BEGIN
  SELECT RAISE(ABORT, 'events is append only');
END;

-- Queues deliver at least once. A consumer records each event ID it processed.
CREATE TABLE processed_events (
  consumer     TEXT NOT NULL,
  event_id     TEXT NOT NULL,
  processed_at TEXT NOT NULL,
  PRIMARY KEY (consumer, event_id)
) WITHOUT ROWID;
