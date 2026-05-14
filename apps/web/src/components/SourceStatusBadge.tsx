import clsx from 'clsx';
import type { SourceState } from '../types/index.ts';

const STATUS_CONFIG: Record<
  SourceState['status'],
  { label: string; dot: string; badge: string }
> = {
  working: {
    label: 'Aktiv',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  partial: {
    label: 'Teilweise',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  blocked: {
    label: 'Blockiert',
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  disabled: {
    label: 'Deaktiviert',
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  },
};

export function SourceStatusBadge({ status }: { status: SourceState['status'] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full', cfg.badge)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}
