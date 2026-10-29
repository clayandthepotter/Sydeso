-- Owner: planning. One Linear connection per tenant.
-- The token is encrypted with AES-GCM. The tenant ID is the associated data.
CREATE TABLE linear_connections (
  tenant_id        TEXT PRIMARY KEY,
  token_type       TEXT NOT NULL CHECK (token_type IN ('api_key', 'oauth')),
  token_sealed     TEXT NOT NULL,
  team_id          TEXT NOT NULL,
  team_name        TEXT NOT NULL,
  connected_at     TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

-- Owner: triage. The Linear projects that triage can route to.
-- Triage builds it from ProjectsSynced events. It never reads planning tables.
CREATE TABLE triage_projects (
  tenant_id     TEXT NOT NULL,
  name          TEXT NOT NULL,
  last_event_id TEXT NOT NULL,
  PRIMARY KEY (tenant_id, name)
) WITHOUT ROWID;

-- Owner: planning. ItemRouted events that wait for a Linear setup (no connection, a missing state or project).
-- Planning replays them after the person connects or refreshes Linear.
CREATE TABLE planner_pending (
  tenant_id  TEXT NOT NULL,
  event_id   TEXT NOT NULL,
  event      TEXT NOT NULL CHECK (json_valid(event)),
  reason     TEXT NOT NULL,
  parked_at  TEXT NOT NULL,
  PRIMARY KEY (tenant_id, event_id)
) WITHOUT ROWID;
