import type Database from 'better-sqlite3';
import { SOURCES } from '@cruise-deals/scrapers';
import type { SourceState } from '@cruise-deals/shared';

interface DbSource {
  id: string;
  name: string;
  base_url: string;
  enabled: number;
  allowed: number;
  requires_browser: number;
  rate_limit_ms: number;
  notes: string;
  legal_notes: string | null;
  status: string;
  last_scraped_at: string | null;
  last_error: string | null;
}

function dbToSourceState(row: DbSource): SourceState {
  return {
    id: row.id,
    name: row.name,
    baseUrl: row.base_url,
    enabled: row.enabled === 1,
    allowed: row.allowed === 1,
    requiresBrowser: row.requires_browser === 1,
    rateLimitMs: row.rate_limit_ms,
    notes: row.notes,
    legalNotes: row.legal_notes ?? undefined,
    status: row.status as SourceState['status'],
    lastScrapedAt: row.last_scraped_at,
    lastError: row.last_error,
  };
}

export function syncSources(db: Database.Database): void {
  const upsert = db.prepare(`
    INSERT INTO cruise_sources (id, name, base_url, enabled, allowed, requires_browser, rate_limit_ms, notes, legal_notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      base_url = excluded.base_url,
      enabled = excluded.enabled,
      allowed = excluded.allowed,
      requires_browser = excluded.requires_browser,
      rate_limit_ms = excluded.rate_limit_ms,
      notes = excluded.notes,
      legal_notes = excluded.legal_notes,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  `);

  const sync = db.transaction(() => {
    for (const s of SOURCES) {
      const existing = db.prepare<[string], DbSource>('SELECT * FROM cruise_sources WHERE id = ?').get(s.id);
      const status = existing?.status ?? (s.enabled && s.allowed ? 'disabled' : 'disabled');
      upsert.run(s.id, s.name, s.baseUrl, s.enabled ? 1 : 0, s.allowed ? 1 : 0, s.requiresBrowser ? 1 : 0, s.rateLimitMs, s.notes, s.legalNotes ?? null, status);
    }
  });
  sync();
}

export function getAllSources(db: Database.Database): SourceState[] {
  const rows = db.prepare<[], DbSource>('SELECT * FROM cruise_sources ORDER BY name').all();
  return rows.map(dbToSourceState);
}

export function updateSourceStatus(
  db: Database.Database,
  sourceId: string,
  status: SourceState['status'],
  lastError?: string
): void {
  db.prepare(`
    UPDATE cruise_sources
    SET status = ?, last_scraped_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), last_error = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = ?
  `).run(status, lastError ?? null, sourceId);
}
