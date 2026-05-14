import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { CruiseInsert } from '@cruise-deals/shared';
import { computeDealScore, computeNormalizedHash, computeRawHash } from '@cruise-deals/shared';
import { BaseScraper, type ScraperContext } from '../../core/base.js';
import type { SourceConfig } from '@cruise-deals/shared';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class MockScraper extends BaseScraper {
  constructor(config: SourceConfig, context: ScraperContext) {
    super(config, context);
  }

  async run(): Promise<CruiseInsert[]> {
    this.log.info('Loading mock cruise data');

    // Try loading from data/seed.json relative to project root
    const seedPaths = [
      join(__dirname, '../../../../../../data/seed.json'),
      join(process.cwd(), 'data/seed.json'),
    ];

    let raw: Record<string, unknown>[] = [];
    for (const p of seedPaths) {
      try {
        const content = await readFile(p, 'utf-8');
        raw = JSON.parse(content);
        this.log.info({ path: p, count: raw.length }, 'Loaded seed data');
        break;
      } catch {
        // try next path
      }
    }

    if (raw.length === 0) {
      this.log.warn('No seed.json found, using inline fallback');
      raw = INLINE_SEED;
    }

    const scrapedAt = new Date().toISOString();

    return raw.map((item) => {
      const rawHash = computeRawHash(item);
      const partial = {
        source: 'mock',
        sourceUrl: (item.sourceUrl as string) ?? null,
        scrapedAt,
        cruiseLine: (item.cruiseLine as string) ?? null,
        shipName: (item.shipName as string) ?? null,
        title: (item.title as string) ?? 'Unbekannte Kreuzfahrt',
        departurePort: (item.departurePort as string) ?? null,
        destinationRegion: (item.destinationRegion as string) ?? null,
        itinerarySummary: (item.itinerarySummary as string) ?? null,
        departureDate: (item.departureDate as string) ?? null,
        returnDate: (item.returnDate as string) ?? null,
        nights: (item.nights as number) ?? null,
        cabinType: (item.cabinType as CruiseInsert['cabinType']) ?? null,
        boardType: (item.boardType as CruiseInsert['boardType']) ?? null,
        priceTotal: (item.priceTotal as number) ?? null,
        pricePerNight:
          (item.pricePerNight as number) ??
          (item.priceTotal && item.nights
            ? Math.round(((item.priceTotal as number) / (item.nights as number)) * 100) / 100
            : null),
        currency: (item.currency as string) ?? 'EUR',
        taxesIncluded: (item.taxesIncluded as boolean) ?? null,
        availabilityText: (item.availabilityText as string) ?? null,
        bookingLabel: (item.bookingLabel as string) ?? null,
        imageUrl: (item.imageUrl as string) ?? null,
        rawHash,
        normalizedHash: null,
        dealScore: null,
      };
      const normalizedHash = computeNormalizedHash(partial);
      const withHashes = { ...partial, normalizedHash };
      const { total } = computeDealScore(withHashes as Parameters<typeof computeDealScore>[0]);
      return { ...withHashes, dealScore: total };
    });
  }
}

// Inline fallback seed — used when data/seed.json cannot be found
const INLINE_SEED: Record<string, unknown>[] = [
  {
    cruiseLine: 'Costa Cruises',
    shipName: 'Costa Fascinosa',
    title: 'Karibik-Traumreise ab Barbados',
    departurePort: 'Bridgetown, Barbados',
    destinationRegion: 'Karibik',
    itinerarySummary: 'Barbados → Martinique → St. Lucia → Antigua → St. Kitts → Barbados',
    departureDate: '2026-12-20',
    returnDate: '2027-01-03',
    nights: 14,
    cabinType: 'inside',
    boardType: 'full-board',
    priceTotal: 1099,
    currency: 'EUR',
    taxesIncluded: false,
    availabilityText: 'Nur noch 4 Kabinen',
    bookingLabel: 'Jetzt buchen',
    sourceUrl: 'https://example.com/mock',
  },
];
