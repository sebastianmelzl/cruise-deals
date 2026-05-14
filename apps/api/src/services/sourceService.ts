import type Database from 'better-sqlite3';
import { SOURCES } from '@cruise-deals/scrapers';
import type { SourceState, SourceConfig } from '@cruise-deals/shared';

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
  search_params: string | null;
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
    searchParams: row.search_params ? JSON.parse(row.search_params) : null,
  };
}

export function syncSources(db: Database.Database): void {
  // On conflict: preserve user-toggled `enabled` and user-configured `search_params`.
  // `allowed` is always authoritative from config (legal constraint).
  const upsert = db.prepare(`
    INSERT INTO cruise_sources (id, name, base_url, enabled, allowed, requires_browser, rate_limit_ms, notes, legal_notes, status, search_params)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      base_url = excluded.base_url,
      allowed = excluded.allowed,
      requires_browser = excluded.requires_browser,
      rate_limit_ms = excluded.rate_limit_ms,
      notes = excluded.notes,
      legal_notes = excluded.legal_notes,
      search_params = COALESCE(cruise_sources.search_params, excluded.search_params),
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  `);

  const sync = db.transaction(() => {
    for (const s of SOURCES) {
      const existing = db.prepare<[string], DbSource>('SELECT * FROM cruise_sources WHERE id = ?').get(s.id);
      const status = existing?.status ?? 'disabled';
      // Only seed search_params on first insert; preserve existing user-configured params
      const searchParams = existing?.search_params ?? (s.searchParams ? JSON.stringify(s.searchParams) : null);
      upsert.run(s.id, s.name, s.baseUrl, s.enabled ? 1 : 0, s.allowed ? 1 : 0, s.requiresBrowser ? 1 : 0, s.rateLimitMs, s.notes, s.legalNotes ?? null, status, searchParams);
    }
  });
  sync();
}

export function setSourceEnabled(db: Database.Database, id: string, enabled: boolean): SourceState | null {
  const row = db.prepare<[string], DbSource>('SELECT * FROM cruise_sources WHERE id = ?').get(id);
  if (!row) return null;
  if (!row.allowed) return null; // can't enable a legally disallowed source
  db.prepare(`
    UPDATE cruise_sources SET enabled = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?
  `).run(enabled ? 1 : 0, id);
  const updated = db.prepare<[string], DbSource>('SELECT * FROM cruise_sources WHERE id = ?').get(id)!;
  return dbToSourceState(updated);
}

export function setSourceSearchParams(
  db: Database.Database,
  id: string,
  searchParams: Record<string, string>
): SourceState | null {
  const row = db.prepare<[string], DbSource>('SELECT * FROM cruise_sources WHERE id = ?').get(id);
  if (!row || !row.allowed) return null;
  db.prepare(`
    UPDATE cruise_sources SET search_params = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?
  `).run(JSON.stringify(searchParams), id);
  const updated = db.prepare<[string], DbSource>('SELECT * FROM cruise_sources WHERE id = ?').get(id)!;
  return dbToSourceState(updated);
}

export function getEnabledAllowedSourceConfigs(db: Database.Database): SourceConfig[] {
  const rows = db.prepare<[], DbSource>(
    'SELECT * FROM cruise_sources WHERE enabled = 1 AND allowed = 1'
  ).all();
  return rows.map((row) => {
    const base = SOURCES.find((s) => s.id === row.id);
    if (!base) return null;
    const dbParams: Record<string, string> | null = row.search_params ? JSON.parse(row.search_params) : null;
    return { ...base, searchParams: dbParams ?? base.searchParams } as SourceConfig;
  }).filter((s): s is SourceConfig => s !== null);
}

export function getEnabledAllowedSourceIds(db: Database.Database): Set<string> {
  const rows = db.prepare<[], { id: string }>(
    'SELECT id FROM cruise_sources WHERE enabled = 1 AND allowed = 1'
  ).all();
  return new Set(rows.map((r) => r.id));
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
