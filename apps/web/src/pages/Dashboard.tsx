import { useState, useCallback } from 'react';
import { Search, LayoutGrid, List, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { useCruises, useFilterOptions } from '../hooks/useCruises.ts';
import { CruiseCard } from '../components/CruiseCard.tsx';
import { CruiseTable } from '../components/CruiseTable.tsx';
import { FilterPanel } from '../components/FilterPanel.tsx';
import { DealBadge } from '../components/DealBadge.tsx';
import { Pagination } from '../components/Pagination.tsx';
import { LoadingCards, LoadingTable } from '../components/LoadingState.tsx';
import { EmptyState, ErrorState } from '../components/EmptyState.tsx';
import { triggerScrape } from '../api/client.ts';
import type { CruiseFilters, SortField, ViewMode } from '../types/index.ts';
import clsx from 'clsx';
import { useQueryClient } from '@tanstack/react-query';

const EMPTY_FILTERS: CruiseFilters = {};

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'best-deal', label: 'Bester Deal' },
  { value: 'cheapest', label: 'Günstigste' },
  { value: 'soonest-departure', label: 'Früheste Abfahrt' },
  { value: 'shortest', label: 'Kürzeste' },
  { value: 'longest', label: 'Längste' },
  { value: 'newest-scraped', label: 'Zuletzt gefunden' },
];

export function Dashboard() {
  const [filters, setFilters] = useState<CruiseFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortField>('best-deal');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>('cards');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, isFetching } = useCruises(filters, sort, page);
  const { data: filterOptions } = useFilterOptions();

  const handleFilterChange = useCallback((f: CruiseFilters) => {
    setFilters(f);
    setPage(1);
  }, []);

  const handleSort = useCallback((s: SortField) => {
    setSort(s);
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }, []);

  const handleScrape = async () => {
    setScraping(true);
    setScrapeMsg(null);
    try {
      const result = await triggerScrape() as { totalNew: number; totalUpdated: number };
      setScrapeMsg(`${result.totalNew} neue, ${result.totalUpdated} aktualisierte Angebote`);
      await queryClient.invalidateQueries({ queryKey: ['cruises'] });
      await queryClient.invalidateQueries({ queryKey: ['filter-options'] });
    } catch (err) {
      setScrapeMsg(`Fehler: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setScraping(false);
    }
  };

  const handleSearch = (value: string) => {
    handleFilterChange({ ...filters, search: value || undefined });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            placeholder="Suche nach Reise, Reederei, Schiff…"
            value={filters.search ?? ''}
            onChange={(e) => handleSearch(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>

        {/* Sort */}
        <div className="relative shrink-0">
          <select
            value={sort}
            onChange={(e) => handleSort(e.target.value as SortField)}
            className="input pr-8 appearance-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* View toggle */}
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
          <button
            onClick={() => setView('cards')}
            className={clsx(
              'p-2 transition-colors',
              view === 'cards'
                ? 'bg-ocean-600 text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
            )}
            title="Kartenansicht"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('table')}
            className={clsx(
              'p-2 transition-colors',
              view === 'table'
                ? 'bg-ocean-600 text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
            )}
            title="Tabellenansicht"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile filter button */}
        <button
          onClick={() => setMobileFilterOpen(true)}
          className="btn-secondary lg:hidden shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
        </button>

        {/* Scrape button */}
        <button
          onClick={handleScrape}
          disabled={scraping}
          className="btn-secondary shrink-0"
          title="Neue Daten laden"
        >
          <RefreshCw className={clsx('w-4 h-4', scraping && 'animate-spin')} />
          <span className="hidden sm:inline">{scraping ? 'Lädt…' : 'Aktualisieren'}</span>
        </button>
      </div>

      {scrapeMsg && (
        <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
          Scrape: {scrapeMsg}
        </p>
      )}

      {/* Results summary */}
      {data && (
        <div className="flex items-center gap-2 flex-wrap -mt-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {isFetching ? 'Aktualisiere…' : `${data.total} Angebote gefunden`}
          </span>
          {data.data.slice(0, 2).map((c) => (
            c.dealScore !== null && c.dealScore >= 65 ? (
              <DealBadge key={c.id} score={c.dealScore} size="sm" />
            ) : null
          ))}
        </div>
      )}

      {/* Main layout */}
      <div className="flex gap-6 items-start">
        {/* Filter sidebar */}
        <FilterPanel
          filters={filters}
          options={filterOptions}
          onChange={handleFilterChange}
          onReset={handleReset}
          mobileOpen={mobileFilterOpen}
          onMobileClose={() => setMobileFilterOpen(false)}
        />

        {/* Content area */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {isError && (
            <ErrorState message={(error as Error)?.message} />
          )}

          {isLoading ? (
            view === 'cards' ? <LoadingCards /> : <LoadingTable />
          ) : data?.data.length === 0 ? (
            <EmptyState onReset={handleReset} />
          ) : view === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {data?.data.map((cruise) => (
                <CruiseCard key={cruise.id} cruise={cruise} />
              ))}
            </div>
          ) : (
            <CruiseTable
              cruises={data?.data ?? []}
              sort={sort}
              onSort={handleSort}
            />
          )}

          {data && data.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={data.pageSize}
              onPage={setPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
