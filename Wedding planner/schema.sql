-- ============================================================================
-- Cloudflare D1 Database Schema — Lumière Wedding Planner
-- Database Engine: SQLite / Cloudflare D1 Serverless SQL
-- ============================================================================

CREATE TABLE IF NOT EXISTS wedding_store (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for instant lookup by document ID
CREATE INDEX IF NOT EXISTS idx_wedding_store_id ON wedding_store(id);
