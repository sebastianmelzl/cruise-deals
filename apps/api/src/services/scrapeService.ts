import { v4 as uuidv4 } from 'uuid';
import type Database from 'better-sqlite3';
import { MockScraper, KreuzfahrtenDeScraper, KreuzfahrtDeScraper, closeBrowser } from '@cruise-deals/scrapers';
import type { BaseScraper, ScraperContext } from '@cruise-deals/scrapers';
import type { SourceConfig, ScrapeRunResult } from '@cruise-deals/shared';
import { upsertCruises } from './cruiseService.js';
import { updateSourceStatus, getEnabledAllowedSourceConfigs } from './sourceService.js';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });

const SCRAPER_CONTEXT: ScraperContext = {
  screenshotDir: process.env.SCREENSHOT_DIR ?? './data/screenshots',
  snapshotDir: process.env.SNAPSHOT_DIR ?? './data/snapshots',
};

function createScraper(config: SourceConfig): BaseScraper | null {
  switch (config.id) {
    case 'mock': return new MockScraper(config, SCRAPER_CONTEXT);
    case 'kreuzfahrten-de': return new KreuzfahrtenDeScraper(config, SCRAPER_CONTEXT);
    case 'kreuzfahrt-de': return new KreuzfahrtDeScraper(config, SCRAPER_CONTEXT);
    default: return null;
  }
}

export async function runScrape(
  db: Database.Database,
  sourceIds?: string[]
): Promise<{ runId: string; results: ScrapeRunResult[]; totalNew: number; totalUpdated: number }> {
  const runId = uuidv4();
  const startedAt = new Date().toISOString();
  const results: ScrapeRunResult[] = [];

  const allEnabled = getEnabledAllowedSourceConfigs(db);
  const targets = allEnabled.filter((s) => {
    if (sourceIds && sourceIds.length > 0) return sourceIds.includes(s.id);
    return true;
  });

  for (const source of targets) {
    const t0 = Date.now();
    const scraper = createScraper(source);

    if (!scraper) {
      results.push({
        sourceId: source.id,
        sourceName: source.name,
        status: 'skipped',
        cruisesFound: 0,
        cruisesNew: 0,
        cruisesUpdated: 0,
        durationMs: 0,
        error: 'No scraper implementation for this source',
      });
      continue;
    }

    try {
      logger.info({ sourceId: source.id }, 'Running scraper');

      // Log run start
      db.prepare(`
        INSERT INTO scrape_runs (id, source_id, started_at, status)
        VALUES (?, ?, ?, 'running')
      `).run(uuidv4(), source.id, startedAt);

      const cruises = await scraper.run();
      const { inserted, updated } = upsertCruises(db, cruises);

      updateSourceStatus(db, source.id, cruises.length > 0 ? 'working' : 'partial');

      results.push({
        sourceId: source.id,
        sourceName: source.name,
        status: 'completed',
        cruisesFound: cruises.length,
        cruisesNew: inserted,
        cruisesUpdated: updated,
        durationMs: Date.now() - t0,
      });

      logger.info({ sourceId: source.id, found: cruises.length, inserted, updated }, 'Scraper done');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error({ sourceId: source.id, err }, 'Scraper failed');
      updateSourceStatus(db, source.id, 'blocked', errMsg);

      results.push({
        sourceId: source.id,
        sourceName: source.name,
        status: 'failed',
        cruisesFound: 0,
        cruisesNew: 0,
        cruisesUpdated: 0,
        durationMs: Date.now() - t0,
        error: errMsg,
      });
    }
  }

  // Close browser if any scraper used it
  try { await closeBrowser(); } catch { /* noop */ }

  const totalNew = results.reduce((s, r) => s + r.cruisesNew, 0);
  const totalUpdated = results.reduce((s, r) => s + r.cruisesUpdated, 0);

  return { runId, results, totalNew, totalUpdated };
}
