-- Landing-page waitlist. The Worker also creates this table on first use (CREATE TABLE IF NOT EXISTS),
-- so existing deployments need no manual migration.
CREATE TABLE IF NOT EXISTS waitlist (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  learning_for TEXT NOT NULL,
  role TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  remove_hash TEXT NOT NULL,
  created INTEGER NOT NULL
);
