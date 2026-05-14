export function LoadingCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card animate-pulse">
          <div className="h-44 bg-slate-200 dark:bg-slate-800" />
          <div className="p-4 flex flex-col gap-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
            <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-1/2" />
            <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-2/3" />
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mt-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingTable() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 animate-pulse"
        >
          <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 flex-1 bg-slate-100 dark:bg-slate-800/50 rounded" />
          <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800/50 rounded hidden md:block" />
          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      ))}
    </div>
  );
}
