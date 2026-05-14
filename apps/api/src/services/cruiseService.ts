import { v4 as uuidv4 } from 'uuid';
import type Database from 'better-sqlite3';
import type { CruiseInsert, CruiseFilters, SortField } from '@cruise-deals/shared';
import type { DbCruise } from '../db/index.js';

export function upsertCruises(
  db: Database.Database,
  cruises: CruiseInsert[]
): { inserted: number; updated: number } {
  let inserted = 0;
  let updated = 0;

  const upsertStmt = db.prepare<[
    string, string, string | null, string, string | null, string | null, string,
    string | null, string | null, string | null, string | null, string | null,
    number | null, string | null, string | null, number | null, number | null,
    string, number | null, string | null, string | null, number | null,
    string | null, string | null, string | null, string, string
  ]>(`
    INSERT INTO cruises (
      id, source, source_url, scraped_at, cruise_line, ship_name, title,
      departure_port, destination_region, itinerary_summary,
      departure_date, return_date, nights, cabin_type, board_type,
      price_total, price_per_night, currency, taxes_included,
      availability_text, booking_label, deal_score,
      image_url, raw_hash, normalized_hash, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      source_url = excluded.source_url,
      scraped_at = excluded.scraped_at,
      cruise_line = excluded.cruise_line,
      ship_name = excluded.ship_name,
      title = excluded.title,
      departure_port = excluded.departure_port,
      destination_region = excluded.destination_region,
      itinerary_summary = excluded.itinerary_summary,
      departure_date = excluded.departure_date,
      return_date = excluded.return_date,
      nights = excluded.nights,
      cabin_type = excluded.cabin_type,
      board_type = excluded.board_type,
      price_total = excluded.price_total,
      price_per_night = excluded.price_per_night,
      currency = excluded.currency,
      taxes_included = excluded.taxes_included,
      availability_text = excluded.availability_text,
      booking_label = excluded.booking_label,
      deal_score = excluded.deal_score,
      image_url = excluded.image_url,
      raw_hash = excluded.raw_hash,
      normalized_hash = excluded.normalized_hash,
      updated_at = excluded.updated_at
  `);

  const existsStmt = db.prepare<[string], { id: string }>(
    'SELECT id FROM cruises WHERE normalized_hash = ? LIMIT 1'
  );

  const insertMany = db.transaction((items: CruiseInsert[]) => {
    for (const c of items) {
      const now = new Date().toISOString();
      const existing = c.normalizedHash ? existsStmt.get(c.normalizedHash) : null;
      const id = existing?.id ?? c.id ?? uuidv4();

      upsertStmt.run(
        id, c.source, c.sourceUrl, c.scrapedAt, c.cruiseLine, c.shipName, c.title,
        c.departurePort, c.destinationRegion, c.itinerarySummary,
        c.departureDate, c.returnDate, c.nights, c.cabinType, c.boardType,
        c.priceTotal, c.pricePerNight, c.currency,
        c.taxesIncluded === null ? null : c.taxesIncluded ? 1 : 0,
        c.availabilityText, c.bookingLabel, c.dealScore,
        c.imageUrl, c.rawHash, c.normalizedHash, now, now
      );

      if (existing) updated++;
      else inserted++;
    }
  });

  insertMany(cruises);
  return { inserted, updated };
}

export interface ListCruisesOptions {
  filters: CruiseFilters;
  sort: SortField;
  page: number;
  pageSize: number;
}

export function listCruises(
  db: Database.Database,
  opts: ListCruisesOptions
): { rows: DbCruise[]; total: number } {
  const { filters, sort, page, pageSize } = opts;
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  // Only future or near-future departures by default
  if (!filters.departureMonth) {
    conditions.push("(departure_date IS NULL OR departure_date >= date('now', '-7 days'))");
  }

  if (filters.maxPrice !== undefined) {
    conditions.push('price_total <= ?');
    params.push(filters.maxPrice);
  }
  if (filters.minPrice !== undefined) {
    conditions.push('price_total >= ?');
    params.push(filters.minPrice);
  }
  if (filters.minNights !== undefined) {
    conditions.push('nights >= ?');
    params.push(filters.minNights);
  }
  if (filters.maxNights !== undefined) {
    conditions.push('nights <= ?');
    params.push(filters.maxNights);
  }
  if (filters.departureMonth) {
    conditions.push("strftime('%Y-%m', departure_date) = ?");
    params.push(filters.departureMonth);
  }
  if (filters.departurePort) {
    conditions.push('LOWER(departure_port) LIKE ?');
    params.push(`%${filters.departurePort.toLowerCase()}%`);
  }
  if (filters.destinationRegion) {
    conditions.push('destination_region = ?');
    params.push(filters.destinationRegion);
  }
  if (filters.cruiseLine) {
    conditions.push('LOWER(cruise_line) LIKE ?');
    params.push(`%${filters.cruiseLine.toLowerCase()}%`);
  }
  if (filters.cabinType) {
    conditions.push('cabin_type = ?');
    params.push(filters.cabinType);
  }
  if (filters.boardType) {
    conditions.push('board_type = ?');
    params.push(filters.boardType);
  }
  if (filters.source) {
    conditions.push('source = ?');
    params.push(filters.source);
  }
  if (filters.minDealScore !== undefined) {
    conditions.push('deal_score >= ?');
    params.push(filters.minDealScore);
  }
  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push('(LOWER(title) LIKE ? OR LOWER(cruise_line) LIKE ? OR LOWER(ship_name) LIKE ? OR LOWER(itinerary_summary) LIKE ?)');
    params.push(term, term, term, term);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const orderBy = {
    cheapest: 'price_total ASC NULLS LAST',
    'best-deal': 'deal_score DESC NULLS LAST, price_per_night ASC NULLS LAST',
    'soonest-departure': 'departure_date ASC NULLS LAST',
    shortest: 'nights ASC NULLS LAST',
    longest: 'nights DESC NULLS LAST',
    'newest-scraped': 'scraped_at DESC',
  }[sort] ?? 'deal_score DESC NULLS LAST';

  const countRow = db.prepare<typeof params, { count: number }>(
    `SELECT COUNT(*) as count FROM cruises ${where}`
  ).get(...params);
  const total = countRow?.count ?? 0;

  const offset = (page - 1) * pageSize;
  const rows = db.prepare<[...typeof params, number, number], DbCruise>(
    `SELECT * FROM cruises ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
  ).all(...params, pageSize, offset);

  return { rows, total };
}

export function getCruiseById(db: Database.Database, id: string): DbCruise | undefined {
  return db.prepare<[string], DbCruise>('SELECT * FROM cruises WHERE id = ?').get(id);
}

export interface FilterOptions {
  cruiseLines: string[];
  destinationRegions: string[];
  departurePorts: string[];
  sources: string[];
  cabinTypes: string[];
  boardTypes: string[];
  priceRange: { min: number; max: number };
  nightsRange: { min: number; max: number };
  departureDateRange: { min: string; max: string };
}

export function getFilterOptions(db: Database.Database): FilterOptions {
  const distinct = <T extends string>(col: string): T[] =>
    db.prepare<[], { val: T }>(`SELECT DISTINCT ${col} as val FROM cruises WHERE ${col} IS NOT NULL ORDER BY val`)
      .all()
      .map((r) => r.val);

  const rangeRow = db.prepare<[], { minPrice: number; maxPrice: number; minNights: number; maxNights: number; minDate: string; maxDate: string }>(
    `SELECT
       MIN(price_total) as minPrice, MAX(price_total) as maxPrice,
       MIN(nights) as minNights, MAX(nights) as maxNights,
       MIN(departure_date) as minDate, MAX(departure_date) as maxDate
     FROM cruises`
  ).get();

  return {
    cruiseLines: distinct('cruise_line'),
    destinationRegions: distinct('destination_region'),
    departurePorts: distinct('departure_port'),
    sources: distinct('source'),
    cabinTypes: distinct('cabin_type'),
    boardTypes: distinct('board_type'),
    priceRange: { min: rangeRow?.minPrice ?? 0, max: rangeRow?.maxPrice ?? 10000 },
    nightsRange: { min: rangeRow?.minNights ?? 1, max: rangeRow?.maxNights ?? 30 },
    departureDateRange: { min: rangeRow?.minDate ?? '', max: rangeRow?.maxDate ?? '' },
  };
}
