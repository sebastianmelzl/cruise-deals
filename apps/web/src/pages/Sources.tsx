import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSources, patchSource } from '../api/client.ts';
import { SourceStatusBadge } from '../components/SourceStatusBadge.tsx';
import { ExternalLink, Globe, Chrome, Clock, Settings, Save } from 'lucide-react';
import type { SourceState } from '../types/index.ts';

// Human-readable labels for known kreuzfahrten.de search params
const PARAM_META: Record<string, { label: string; type: 'text' | 'number' | 'select'; options?: { value: string; label: string }[] }> = {
  srcReiseArt:          { label: 'Kreuzfahrt-Art', type: 'select', options: [{ value: 'Hochsee', label: 'Hochsee' }, { value: 'Fluss', label: 'Fluss' }, { value: 'beide', label: 'Beide' }] },
  srcPriceMin:          { label: 'Mindestpreis (€)', type: 'number' },
  srcPriceMax:          { label: 'Maximalpreis (€, 0=unbegrenzt)', type: 'number' },
  srcRouteDurationMin:  { label: 'Min. Nächte (0=alle)', type: 'number' },
  srcRouteDurationMax:  { label: 'Max. Nächte (0=alle)', type: 'number' },
  srcOrderBy:           { label: 'Sortierung', type: 'select', options: [
    { value: 'preis_asc',         label: 'Preis aufsteigend' },
    { value: 'preis_desc',        label: 'Preis absteigend' },
    { value: 'c_dateDepart_ASC',  label: 'Abfahrt aufsteigend' },
    { value: 'c_dateDepart_DESC', label: 'Abfahrt absteigend' },
  ]},
  'per-page':           { label: 'Ergebnisse pro Seite', type: 'number' },
  _maxPages:            { label: 'Seiten scrapen (max.)', type: 'number' },
};

function SearchParamsEditor({ source, onSave }: { source: SourceState; onSave: (params: Record<string, string>) => void }) {
  const [params, setParams] = useState<Record<string, string>>(source.searchParams ?? {});

  const knownKeys = Object.keys(PARAM_META);
  const displayKeys = knownKeys.filter((k) => k in params || k in PARAM_META);

  return (
    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Sucheinstellungen</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {displayKeys.map((key) => {
          const meta = PARAM_META[key];
          const val = params[key] ?? '';
          return (
            <div key={key} className="flex flex-col gap-0.5">
              <label className="text-xs text-slate-500 dark:text-slate-400">{meta.label}</label>
              {meta.type === 'select' ? (
                <select
                  value={val}
                  onChange={(e) => setParams((p) => ({ ...p, [key]: e.target.value }))}
                  className="input text-sm py-1"
                >
                  {meta.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  value={val}
                  onChange={(e) => setParams((p) => ({ ...p, [key]: e.target.value }))}
                  className="input text-sm py-1"
                  min={0}
                />
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={() => onSave(params)}
        className="btn-secondary mt-3 text-sm py-1"
      >
        <Save className="w-3 h-3" />
        Speichern
      </button>
    </div>
  );
}

export function Sources() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: fetchSources,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      patchSource(id, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sources'] }),
  });

  const paramsMutation = useMutation({
    mutationFn: ({ id, searchParams }: { id: string; searchParams: Record<string, string> }) =>
      patchSource(id, { searchParams }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sources'] }),
  });

  return (
    <div className="max-w-4xl flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Datenquellen</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Übersicht aller konfigurierten Scraper-Quellen mit rechtlichem und technischem Status.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 h-20 animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data?.sources.map((source) => (
            <div key={source.id} className="card p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {source.name}
                    </span>
                    <SourceStatusBadge status={source.status} />
                    {!source.allowed && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                        Scraping untersagt
                      </span>
                    )}
                    {source.requiresBrowser && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        <Chrome className="w-3 h-3" />
                        Browser
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">{source.notes}</p>

                  {source.legalNotes && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      ⚠ {source.legalNotes}
                    </p>
                  )}

                  {source.lastError && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 font-mono">
                      {source.lastError}
                    </p>
                  )}

                  {/* Search params editor */}
                  {source.allowed && source.searchParams && (
                    <>
                      <button
                        onClick={() => setExpanded(expanded === source.id ? null : source.id)}
                        className="inline-flex items-center gap-1 text-xs text-ocean-600 dark:text-ocean-400 hover:underline mt-1 w-fit"
                      >
                        <Settings className="w-3 h-3" />
                        {expanded === source.id ? 'Einstellungen schließen' : 'Sucheinstellungen'}
                      </button>
                      {expanded === source.id && (
                        <SearchParamsEditor
                          source={source}
                          onSave={(searchParams) => {
                            paramsMutation.mutate({ id: source.id, searchParams });
                            setExpanded(null);
                          }}
                        />
                      )}
                    </>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {source.allowed && (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={source.enabled}
                      disabled={toggleMutation.isPending}
                      onClick={() => toggleMutation.mutate({ id: source.id, enabled: !source.enabled })}
                      className={[
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:ring-offset-2 disabled:opacity-50',
                        source.enabled
                          ? 'bg-ocean-600 dark:bg-ocean-500'
                          : 'bg-slate-300 dark:bg-slate-600',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                          source.enabled ? 'translate-x-6' : 'translate-x-1',
                        ].join(' ')}
                      />
                    </button>
                  )}
                  <div className="flex flex-col items-end gap-1 text-xs text-slate-400 dark:text-slate-500">
                    <a
                      href={source.baseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
                    >
                      <Globe className="w-3 h-3" />
                      {source.id}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {source.lastScrapedAt && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(source.lastScrapedAt).toLocaleString('de-DE')}
                      </span>
                    )}
                    <span>{source.rateLimitMs}ms Rate Limit</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
