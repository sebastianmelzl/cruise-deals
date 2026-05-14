export type CabinType = 'inside' | 'outside' | 'balcony' | 'suite' | 'studio' | 'other' | null;
export type BoardType = 'all-inclusive' | 'full-board' | 'half-board' | 'breakfast' | 'none' | 'other' | null;

export interface Cruise {
  id: string;
  source: string;
  sourceUrl: string | null;
  scrapedAt: string;
  cruiseLine: string | null;
  shipName: string | null;
  title: string;
  departurePort: string | null;
  destinationRegion: string | null;
  itinerarySummary: string | null;
  departureDate: string | null;
  returnDate: string | null;
  nights: number | null;
  cabinType: CabinType;
  boardType: BoardType;
  priceTotal: number | null;
  pricePerNight: number | null;
  currency: string;
  taxesIncluded: boolean | null;
  availabilityText: string | null;
  bookingLabel: string | null;
  dealScore: number | null;
  imageUrl: string | null;
}

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
  departureMonth?: string;
  departurePort?: string;
  destinationRegion?: string;
  cruiseLine?: string;
  cabinType?: CabinType;
  boardType?: BoardType;
  source?: string;
  minDealScore?: number;
  search?: string;
}

export interface CruiseListResponse {
  data: Cruise[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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

export interface SourceState {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  allowed: boolean;
  requiresBrowser: boolean;
  rateLimitMs: number;
  notes: string;
  legalNotes?: string;
  status: 'working' | 'partial' | 'blocked' | 'disabled';
  lastScrapedAt: string | null;
  lastError: string | null;
}

export type ViewMode = 'cards' | 'table';
