import clsx from 'clsx';

interface Props {
  score: number | null;
  size?: 'sm' | 'md';
}

function getLabel(score: number): string {
  if (score >= 80) return 'Top Deal';
  if (score >= 65) return 'Guter Deal';
  if (score >= 50) return 'Solide';
  if (score >= 35) return 'Okay';
  return 'Normal';
}

function getColors(score: number): string {
  if (score >= 80) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  if (score >= 65) return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800';
  if (score >= 50) return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
  if (score >= 35) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
}

export function DealBadge({ score, size = 'sm' }: Props) {
  if (score === null) return null;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-semibold border rounded-full',
        getColors(score),
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
      )}
      title={`Deal Score: ${score}/100`}
    >
      {score >= 65 && <span>★</span>}
      {getLabel(score)}
      <span className="opacity-60 font-normal">{score}</span>
    </span>
  );
}
