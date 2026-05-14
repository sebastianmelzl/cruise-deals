import type { Cruise } from '../types/index.ts';
import { DealBadge } from './DealBadge.tsx';
import { ExternalLink, ArrowUpDown } from 'lucide-react';
import type { SortField } from '../types/index.ts';
import clsx from 'clsx';

interface Props {
  cruises: Cruise[];
  sort: SortField;
  onSort: (s: SortField) => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return '–';
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatPrice(amount: number | null, currency = 'EUR'): string {
  if (amount === null) return '–';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

const BOARD_SHORT: Record<string, string> = {
  'all-inclusive': 'AI',
  'full-board': 'VP',
  'half-board': 'HP',
  breakfast: 'ÜF',
  none: '–',
  other: '?',
};

const CABIN_SHORT: Record<string, string> = {
  inside: 'IN',
  outside: 'AK',
  balcony: 'BK',
  suite: 'SU',
  studio: 'ST',
  other: '?',
};

interface ColDef {
  key: SortField | null;
  label: string;
}

const COLS: ColDef[] = [
  { key: 'best-deal', label: 'Score' },
  { key: null, label: 'Reise' },
  { key: null, label: 'Region' },
  { key: 'soonest-departure', label: 'Abfahrt' },
  { key: 'shortest', label: 'Nächte' },
  { key: null, label: 'Kabine' },
  { key: null, label: 'VP' },
  { key: 'cheapest', label: 'Preis' },
  { key: null, label: 'p. N.' },
  { key: null, label: '' },
];

export function CruiseTable({ cruises, sort, onSort }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            {COLS.map((col) => (
              <th
                key={col.label}
                className={clsx(
                  'px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide whitespace-nowrap',
                  col.key && 'cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 select-none'
                )}
                onClick={() => col.key && onSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.key && (
                    <ArrowUpDown
                      className={clsx('w-3 h-3', sort === col.key ? 'text-ocean-500' : 'opacity-40')}
                    />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {cruises.map((c) => (
            <tr
              key={c.id}
              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td className="px-4 py-3">
                <DealBadge score={c.dealScore} />
              </td>
              <td className="px-4 py-3 max-w-xs">
                <p className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">{c.title}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
                  {[c.cruiseLine, c.shipName].filter(Boolean).join(' · ')}
                </p>
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                {c.destinationRegion ?? '–'}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                {formatDate(c.departureDate)}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-center">
                {c.nights ?? '–'}
              </td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-500 text-center font-mono text-xs">
                {c.cabinType ? CABIN_SHORT[c.cabinType] ?? c.cabinType : '–'}
              </td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-500 text-center font-mono text-xs">
                {c.boardType ? BOARD_SHORT[c.boardType] ?? c.boardType : '–'}
              </td>
              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {formatPrice(c.priceTotal, c.currency)}
              </td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                {c.pricePerNight ? formatPrice(c.pricePerNight, c.currency) : '–'}
              </td>
              <td className="px-4 py-3">
                {c.sourceUrl && (
                  <a
                    href={c.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-ocean-600 dark:text-ocean-400 hover:underline text-xs whitespace-nowrap"
                  >
                    {c.bookingLabel ?? 'Angebot'}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
