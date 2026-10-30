-- Owner: identity. A one use link that adds a passkey on a new device to an existing account.
-- The code is stored only as a SHA-256 hash.
CREATE TABLE device_links (
  code_hash     TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users (user_id),
  created_at    TEXT NOT NULL,
  expires_at    TEXT NOT NULL,
  used_at       TEXT,
  -- The registration challenge that used the link. The passkey insert checks it.
  used_by       TEXT
) WITHOUT ROWID;

CREATE INDEX device_links_user ON device_links (user_id);
