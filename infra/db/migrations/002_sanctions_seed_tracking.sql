-- Tracks when the sanctions data was last loaded so the seed script is idempotent
CREATE TABLE IF NOT EXISTS sanctions_seed_runs (
  id          SERIAL PRIMARY KEY,
  source      TEXT NOT NULL,
  record_count INT NOT NULL DEFAULT 0,
  seeded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
