-- Cruise Deals Database Schema
-- SQLite 3.x

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ─── cruises ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cruises (
  id                TEXT PRIMARY KEY,
  source            TEXT NOT NULL,
  source_url        TEXT,
  scraped_at        TEXT NOT NULL,
  cruise_line       TEXT,
  ship_name         TEXT,
  title             TEXT NOT NULL,
  departure_port    TEXT,
  destination_region TEXT,
  itinerary_summary TEXT,
  departure_date    TEXT,
  return_date       TEXT,
  nights            INTEGER,
  cabin_type        TEXT,
  board_type        TEXT,
  price_total       REAL,
  price_per_night   REAL,
  currency          TEXT DEFAULT 'EUR',
  taxes_included    INTEGER,          -- 1=true, 0=false, NULL=unknown
  availability_text TEXT,
  booking_label     TEXT,
  deal_score        REAL,
  image_url         TEXT,
  raw_hash          TEXT,
  normalized_hash   TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_cruises_source          ON cruises (source);
CREATE INDEX IF NOT EXISTS idx_cruises_departure_date  ON cruises (departure_date);
CREATE INDEX IF NOT EXISTS idx_cruises_price_total     ON cruises (price_total);
CREATE INDEX IF NOT EXISTS idx_cruises_price_per_night ON cruises (price_per_night);
CREATE INDEX IF NOT EXISTS idx_cruises_deal_score      ON cruises (deal_score DESC);
CREATE INDEX IF NOT EXISTS idx_cruises_normalized_hash ON cruises (normalized_hash);
CREATE INDEX IF NOT EXISTS idx_cruises_destination     ON cruises (destination_region);
CREATE INDEX IF NOT EXISTS idx_cruises_cruise_line     ON cruises (cruise_line);

-- ─── cruise_sources ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cruise_sources (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  base_url          TEXT,
  enabled           INTEGER NOT NULL DEFAULT 1,
  allowed           INTEGER NOT NULL DEFAULT 1,
  requires_browser  INTEGER NOT NULL DEFAULT 0,
  rate_limit_ms     INTEGER NOT NULL DEFAULT 2000,
  notes             TEXT,
  legal_notes       TEXT,
  status            TEXT NOT NULL DEFAULT 'disabled',
  last_scraped_at   TEXT,
  last_error        TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ─── scrape_runs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scrape_runs (
  id              TEXT PRIMARY KEY,
  source_id       TEXT,
  started_at      TEXT NOT NULL,
  completed_at    TEXT,
  status          TEXT NOT NULL,   -- running | completed | failed | skipped
  cruises_found   INTEGER DEFAULT 0,
  cruises_new     INTEGER DEFAULT 0,
  cruises_updated INTEGER DEFAULT 0,
  error           TEXT,
  FOREIGN KEY (source_id) REFERENCES cruise_sources (id)
);

CREATE INDEX IF NOT EXISTS idx_scrape_runs_source    ON scrape_runs (source_id);
CREATE INDEX IF NOT EXISTS idx_scrape_runs_started   ON scrape_runs (started_at DESC);
