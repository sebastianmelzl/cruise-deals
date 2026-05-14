import { useQuery } from '@tanstack/react-query';
import { fetchCruises, fetchFilterOptions } from '../api/client.ts';
import type { CruiseFilters, SortField } from '../types/index.ts';

export function useCruises(filters: CruiseFilters, sort: SortField, page: number, pageSize = 24) {
  return useQuery({
    queryKey: ['cruises', filters, sort, page, pageSize],
    queryFn: () => fetchCruises(filters, sort, page, pageSize),
    placeholderData: (prev) => prev,
  });
}

export function useFilterOptions() {
  return useQuery({
    queryKey: ['filter-options'],
    queryFn: fetchFilterOptions,
    staleTime: 5 * 60_000,
  });
}
