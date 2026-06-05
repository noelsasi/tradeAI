-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ── classification_jobs ────────────────────────────────────────────────────────
-- One row per user-submitted classification request (text or PDF document)
CREATE TABLE classification_jobs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status          VARCHAR(16) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  input_type      VARCHAR(16) NOT NULL
                    CHECK (input_type IN ('text', 'document')),
  file_name       TEXT,
  file_url        TEXT,
  total_items     INT NOT NULL DEFAULT 0,
  completed_items INT NOT NULL DEFAULT 0,
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_status ON classification_jobs (status);
CREATE INDEX idx_jobs_created_at ON classification_jobs (created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER jobs_set_updated_at
  BEFORE UPDATE ON classification_jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── classification_results ─────────────────────────────────────────────────────
-- One row per line item extracted from an invoice
CREATE TABLE classification_results (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id                 UUID NOT NULL REFERENCES classification_jobs(id) ON DELETE CASCADE,
  line_number            INT NOT NULL,
  raw_description        TEXT NOT NULL,
  normalized_description TEXT NOT NULL,
  hs_code                VARCHAR(12),
  hs_title               TEXT,
  hs_chapter             TEXT,
  confidence             NUMERIC(5,4),
  risk_level             VARCHAR(16) CHECK (risk_level IN ('Clear', 'Review', 'Flagged')),
  source                 VARCHAR(16) CHECK (source IN ('cache', 'vector', 'ai')),
  ai_reasoning           TEXT,
  alternatives           JSONB,
  sanctions_ofac         VARCHAR(16) DEFAULT 'Clear' CHECK (sanctions_ofac IN ('Clear', 'Review', 'Flagged')),
  sanctions_un           VARCHAR(16) DEFAULT 'Clear' CHECK (sanctions_un IN ('Clear', 'Review', 'Flagged')),
  sanctions_eu           VARCHAR(16) DEFAULT 'Clear' CHECK (sanctions_eu IN ('Clear', 'Review', 'Flagged')),
  flag_note              TEXT,
  user_overridden        BOOL NOT NULL DEFAULT FALSE,
  user_override_code     VARCHAR(12),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_results_job_id ON classification_results (job_id);
CREATE INDEX idx_results_risk_level ON classification_results (risk_level);

-- ── hs_classification_cache ────────────────────────────────────────────────────
-- The 3-layer resolver cache — grows smarter with every classification
CREATE TABLE hs_classification_cache (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description_hash VARCHAR(64) NOT NULL UNIQUE,  -- sha256 of normalized text (Layer 1)
  description      TEXT NOT NULL,
  embedding        VECTOR(1536),                  -- text-embedding-3-small (Layer 2)
  hs_code          VARCHAR(12) NOT NULL,
  hs_title         TEXT,
  confidence       NUMERIC(5,4) NOT NULL,
  verified         BOOL NOT NULL DEFAULT FALSE,   -- user-confirmed = higher trust
  hit_count        INT NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cache_hash ON hs_classification_cache (description_hash);
CREATE INDEX idx_cache_embedding ON hs_classification_cache USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE TRIGGER cache_set_updated_at
  BEFORE UPDATE ON hs_classification_cache
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── sanctions_entries ──────────────────────────────────────────────────────────
-- OpenSanctions consolidated dataset loaded on startup
CREATE TABLE sanctions_entries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_name   VARCHAR(8) NOT NULL CHECK (list_name IN ('ofac', 'un', 'eu')),
  entity_name TEXT NOT NULL,
  aliases     TEXT[] NOT NULL DEFAULT '{}',
  hs_codes    TEXT[] NOT NULL DEFAULT '{}',
  country     TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sanctions_list ON sanctions_entries (list_name);
CREATE INDEX idx_sanctions_entity ON sanctions_entries USING gin (to_tsvector('english', entity_name));

-- ── sanctions_seed_runs ────────────────────────────────────────────────────────
-- Tracks when the OpenSanctions dataset was last loaded; skips re-seed if < 7 days old
CREATE TABLE sanctions_seed_runs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source       TEXT NOT NULL,
  record_count INT NOT NULL DEFAULT 0,
  seeded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
