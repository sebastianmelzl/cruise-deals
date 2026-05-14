/**
 * Seed script — loads mock data into the database.
 * Run: npm run seed --workspace=apps/api
 */

import 'dotenv/config';
import { getDb } from './index.js';
import { MockScraper, SOURCES } from '@cruise-deals/scrapers';
import { upsertCruises } from '../services/cruiseService.js';
import { syncSources } from '../services/sourceService.js';

async function main() {
  console.log('Seeding database...');

  const db = getDb();

  // Sync source definitions
  syncSources(db);

  // Load mock data
  const mockConfig = SOURCES.find((s) => s.id === 'mock')!;
  const scraper = new MockScraper(mockConfig, {
    screenshotDir: './data/screenshots',
    snapshotDir: './data/snapshots',
  });

  const cruises = await scraper.run();
  const { inserted, updated } = upsertCruises(db, cruises);

  console.log(`Seeding complete: ${inserted} inserted, ${updated} updated (${cruises.length} total)`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
