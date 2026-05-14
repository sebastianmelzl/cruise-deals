import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { Cruise } from '@cruise-deals/shared';

const __dirname = dirname(fileURLToPath(import.meta.url));

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const dbPath = process.env.DB_PATH ?? './data/cruises.db';

  // Ensure data directory exists
  mkdirSync(dirname(dbPath), { recursive: true });

  _db = new Database(dbPath, { verbose: process.env.LOG_SQL === 'true' ? console.log : undefined });
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  _db.pragma('synchronous = NORMAL');

  // schema.sql is copied next to the compiled JS by the build script
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  _db.exec(schema);

  // Migrations for existing DBs
  try { _db.exec('ALTER TABLE cruise_sources ADD COLUMN search_params TEXT'); } catch { /* already exists */ }

  return _db;
}

// ─── Type mapping helpers ────────────────────────────────────────────────────

export interface DbCruise {
  id: string;
  source: string;
  source_url: string | null;
  scraped_at: string;
  cruise_line: string | null;
  ship_name: string | null;
  title: string;
  departure_port: string | null;
  destination_region: string | null;
  itinerary_summary: string | null;
  departure_date: string | null;
  return_date: string | null;
  nights: number | null;
  cabin_type: string | null;
  board_type: string | null;
  price_total: number | null;
  price_per_night: number | null;
  currency: string;
  taxes_included: number | null;
  availability_text: string | null;
  booking_label: string | null;
  deal_score: number | null;
  image_url: string | null;
  raw_hash: string | null;
  normalized_hash: string | null;
  created_at: string;
  updated_at: string;
}

export function dbToCruise(row: DbCruise): Cruise {
  return {
    id: row.id,
    source: row.source,
    sourceUrl: row.source_url,
    scrapedAt: row.scraped_at,
    cruiseLine: row.cruise_line,
    shipName: row.ship_name,
    title: row.title,
    departurePort: row.departure_port,
    destinationRegion: row.destination_region,
    itinerarySummary: row.itinerary_summary,
    departureDate: row.departure_date,
    returnDate: row.return_date,
    nights: row.nights,
    cabinType: row.cabin_type as Cruise['cabinType'],
    boardType: row.board_type as Cruise['boardType'],
    priceTotal: row.price_total,
    pricePerNight: row.price_per_night,
    currency: row.currency,
    taxesIncluded: row.taxes_included === null ? null : row.taxes_included === 1,
    availabilityText: row.availability_text,
    bookingLabel: row.booking_label,
    dealScore: row.deal_score,
    imageUrl: row.image_url,
    rawHash: row.raw_hash,
    normalizedHash: row.normalized_hash,
  };
}
