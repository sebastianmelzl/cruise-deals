import { useQuery } from '@tanstack/react-query';
import { fetchSources } from '../api/client.ts';
import { SourceStatusBadge } from '../components/SourceStatusBadge.tsx';
import { ExternalLink, Globe, Chrome, Clock } from 'lucide-react';

export function Sources() {
  const { data, isLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: fetchSources,
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
                <div className="flex flex-col gap-1 min-w-0">
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
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0 text-xs text-slate-400 dark:text-slate-500">
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
          ))}
        </div>
      )}
    </div>
  );
}
