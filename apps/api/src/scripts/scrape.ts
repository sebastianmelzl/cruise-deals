/**
 * CLI scrape runner.
 * Run: npm run scrape --workspace=apps/api
 * Or with specific sources: SOURCE_IDS=mock,kreuzfahrten-de npm run scrape --workspace=apps/api
 */
import 'dotenv/config';
import { getDb } from '../db/index.js';
import { syncSources } from '../services/sourceService.js';
import { runScrape } from '../services/scrapeService.js';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });

async function main() {
  const db = getDb();
  syncSources(db);

  const sourceIds = process.env.SOURCE_IDS?.split(',').map((s) => s.trim());
  logger.info({ sourceIds: sourceIds ?? 'all' }, 'Starting scrape run');

  const { results, totalNew, totalUpdated } = await runScrape(db, sourceIds);

  logger.info({ totalNew, totalUpdated }, 'Scrape complete');

  for (const r of results) {
    if (r.status === 'completed') {
      logger.info(`  ✓ ${r.sourceName}: ${r.cruisesFound} found, ${r.cruisesNew} new, ${r.cruisesUpdated} updated (${r.durationMs}ms)`);
    } else if (r.status === 'failed') {
      logger.error(`  ✗ ${r.sourceName}: FAILED — ${r.error}`);
    } else {
      logger.warn(`  - ${r.sourceName}: skipped`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, 'Scrape script failed');
  process.exit(1);
});
