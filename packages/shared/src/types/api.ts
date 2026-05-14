import type { Cruise, CruiseFilters, SortField } from './cruise.js';
import type { SourceState, ScrapeRunResult } from './source.js';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CruiseListResponse extends PaginatedResponse<Cruise> {
  filters: AppliedFilters;
  sort: SortField;
}

export interface AppliedFilters extends CruiseFilters {
  sort?: SortField;
  page?: number;
  pageSize?: number;
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

export interface SourcesResponse {
  sources: SourceState[];
}

export interface ScrapeRequest {
  sourceIds?: string[]; // if empty, run all enabled+allowed sources
}

export interface ScrapeResponse {
  runId: string;
  results: ScrapeRunResult[];
  startedAt: string;
  completedAt: string;
  totalNew: number;
  totalUpdated: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
