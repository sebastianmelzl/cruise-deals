import 'dotenv/config';
import { createApp } from './app.js';
import { getDb } from './db/index.js';
import { syncSources } from './services/sourceService.js';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });
const PORT = parseInt(process.env.PORT ?? '3001', 10);

async function main() {
  const db = getDb();
  syncSources(db);

  // Auto-seed mock data if the database is empty (e.g. first deploy)
  const count = (db.prepare('SELECT COUNT(*) as n FROM cruises').get() as { n: number }).n;
  if (count === 0) {
    logger.info('Database empty — running initial seed');
    const { MockScraper, SOURCES } = await import('@cruise-deals/scrapers');
    const { upsertCruises } = await import('./services/cruiseService.js');
    const mockConfig = SOURCES.find((s: { id: string }) => s.id === 'mock')!;
    const scraper = new MockScraper(mockConfig, {
      screenshotDir: process.env.SCREENSHOT_DIR ?? './data/screenshots',
      snapshotDir: process.env.SNAPSHOT_DIR ?? './data/snapshots',
    });
    const cruises = await scraper.run();
    const { inserted } = upsertCruises(db, cruises);
    logger.info({ inserted }, 'Auto-seed complete');
  }

  const app = createApp();
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`API running at http://0.0.0.0:${PORT}`);
  });
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start API');
  process.exit(1);
});
