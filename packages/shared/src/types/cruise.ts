export type CabinType =
  | 'inside'
  | 'outside'
  | 'balcony'
  | 'suite'
  | 'studio'
  | 'other'
  | null;

export type BoardType =
  | 'all-inclusive'
  | 'full-board'
  | 'half-board'
  | 'breakfast'
  | 'none'
  | 'other'
  | null;

export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF' | string;

export interface Cruise {
  id: string;
  source: string;
  sourceUrl: string | null;
  scrapedAt: string; // ISO datetime
  cruiseLine: string | null;
  shipName: string | null;
  title: string;
  departurePort: string | null;
  destinationRegion: string | null;
  itinerarySummary: string | null;
  departureDate: string | null; // ISO date YYYY-MM-DD
  returnDate: string | null;   // ISO date YYYY-MM-DD
  nights: number | null;
  cabinType: CabinType;
  boardType: BoardType;
  priceTotal: number | null;
  pricePerNight: number | null;
  currency: Currency;
  taxesIncluded: boolean | null;
  availabilityText: string | null;
  bookingLabel: string | null;
  dealScore: number | null; // 0-100
  imageUrl: string | null;
  rawHash: string | null;
  normalizedHash: string | null;
}

export type CruiseInsert = Omit<Cruise, 'id'> & { id?: string };

export type SortField =
  | 'cheapest'
  | 'best-deal'
  | 'soonest-departure'
  | 'shortest'
  | 'longest'
  | 'newest-scraped';

export interface CruiseFilters {
  maxPrice?: number;
  minPrice?: number;
  minNights?: number;
  maxNights?: number;
  departureMonth?: string; // e.g. "2026-07"
  departurePort?: string;
  destinationRegion?: string;
  cruiseLine?: string;
  cabinType?: CabinType;
  boardType?: BoardType;
  source?: string;
  minDealScore?: number;
  search?: string;
}
