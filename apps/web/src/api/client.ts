import type { CruiseListResponse, CruiseFilters, SortField, FilterOptions, SourceState, Cruise } from '../types/index.ts';

const BASE = '/api';

async function get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = new URL(path, window.location.origin);
  url.pathname = path;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    }
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

export async function fetchCruises(
  filters: CruiseFilters,
  sort: SortField,
  page: number,
  pageSize: number
): Promise<CruiseListResponse> {
  return get<CruiseListResponse>(`${BASE}/cruises`, {
    ...filters,
    sort,
    page,
    pageSize,
  } as Record<string, string | number | boolean | undefined>);
}

export async function fetchCruise(id: string): Promise<Cruise> {
  return get<Cruise>(`${BASE}/cruises/${id}`);
}

export async function fetchFilterOptions(): Promise<FilterOptions> {
  return get<FilterOptions>(`${BASE}/cruises/filters`);
}

export async function fetchSources(): Promise<{ sources: SourceState[] }> {
  return get<{ sources: SourceState[] }>(`${BASE}/sources`);
}

export async function triggerScrape(sourceIds?: string[]): Promise<unknown> {
  const res = await fetch(`${BASE}/scrape/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceIds }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Scrape API ${res.status}: ${body}`);
  }
  return res.json();
}
