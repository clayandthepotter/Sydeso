-- Owner: identity. Tenants, users, passkeys, sessions, and invites.
-- One person is one tenant. Secrets are stored only as SHA-256 hashes.

CREATE TABLE tenants (
  tenant_id             TEXT PRIMARY KEY,
  time_zone             TEXT NOT NULL,
  confidence_threshold  REAL NOT NULL CHECK (confidence_threshold BETWEEN 0 AND 1),
  -- The private part of invites+TOKEN@in.sydeso.com.
  invite_address_token  TEXT NOT NULL UNIQUE,
  -- JSON array of corporate sender addresses.
  allowed_senders       TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(allowed_senders)),
  created_at            TEXT NOT NULL
);

CREATE TABLE users (
  user_id       TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL UNIQUE REFERENCES tenants (tenant_id),
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name  TEXT NOT NULL,
  -- Random bytes for WebAuthn user.id. Not the email.
  webauthn_user_id TEXT NOT NULL UNIQUE,
  created_at    TEXT NOT NULL
);

CREATE TABLE passkeys (
  credential_id TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users (user_id),
  public_key    TEXT NOT NULL,
  counter       INTEGER NOT NULL CHECK (counter >= 0),
  transports    TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(transports)),
  device_type   TEXT NOT NULL,
  backed_up     INTEGER NOT NULL CHECK (backed_up IN (0, 1)),
  created_at    TEXT NOT NULL,
  last_used_at  TEXT
);

CREATE INDEX passkeys_user ON passkeys (user_id);

CREATE TABLE sessions (
  token_hash   TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users (user_id),
  tenant_id    TEXT NOT NULL REFERENCES tenants (tenant_id),
  created_at   TEXT NOT NULL,
  expires_at   TEXT NOT NULL,
  user_agent   TEXT
) WITHOUT ROWID;

CREATE INDEX sessions_user ON sessions (user_id);

-- Sign-up is invite only. An invite works once and expires.
CREATE TABLE invites (
  code_hash    TEXT PRIMARY KEY,
  -- If set, only this email can redeem the invite.
  email        TEXT COLLATE NOCASE,
  note         TEXT,
  created_at   TEXT NOT NULL,
  expires_at   TEXT NOT NULL,
  redeemed_at  TEXT,
  redeemed_by  TEXT
) WITHOUT ROWID;

-- WebAuthn challenges. Each one works once and expires after a few minutes.
CREATE TABLE auth_challenges (
  challenge_id TEXT PRIMARY KEY,
  purpose      TEXT NOT NULL CHECK (purpose IN ('register', 'login')),
  challenge    TEXT NOT NULL,
  payload      TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(payload)),
  expires_at   TEXT NOT NULL
) WITHOUT ROWID;
