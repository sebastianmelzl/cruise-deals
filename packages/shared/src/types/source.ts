export type SourceStatus = 'working' | 'partial' | 'blocked' | 'disabled';

export interface SourceConfig {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  allowed: boolean; // robots.txt / ToS check passed
  requiresBrowser: boolean; // needs Playwright
  rateLimitMs: number;
  notes: string;
  legalNotes?: string;
  searchParams?: Record<string, string>; // default search/filter parameters
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
  status: SourceStatus;
  lastScrapedAt: string | null;
  lastError: string | null;
  searchParams: Record<string, string> | null;
}

export interface ScrapeRunResult {
  sourceId: string;
  sourceName: string;
  status: 'completed' | 'failed' | 'skipped';
  cruisesFound: number;
  cruisesNew: number;
  cruisesUpdated: number;
  durationMs: number;
  error?: string;
}
