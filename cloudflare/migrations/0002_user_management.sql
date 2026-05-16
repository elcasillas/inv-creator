CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  password_hash TEXT NOT NULL,
  disabled_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS app_users_role_idx ON app_users(role);
CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_expires_at_idx ON user_sessions(expires_at);

INSERT OR IGNORE INTO app_users (
  id,
  email,
  full_name,
  role,
  password_hash,
  disabled_at,
  created_at,
  updated_at
) VALUES (
  '6d347c6c-b090-40f5-a4d7-c0f087d127a5',
  'ed.casillas@gmail.com',
  'Ed Casillas',
  'admin',
  'pbkdf2_sha256$100000$ssc4/nIA+KcFZoCNH9fHEA==$JuzKxptcdMqSGJCy7qQ+sEou7K/uB/Qik/oRq4bwl+Q=',
  NULL,
  '2026-05-15T00:00:00.000Z',
  '2026-05-15T00:00:00.000Z'
);
