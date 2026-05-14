import { Ship } from 'lucide-react';

interface Props {
  message?: string;
  onReset?: () => void;
}

export function EmptyState({ message, onReset }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800">
        <Ship className="w-10 h-10 text-slate-400 dark:text-slate-600" />
      </div>
      <div>
        <p className="font-semibold text-slate-700 dark:text-slate-300">Keine Ergebnisse</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
          {message ?? 'Keine Kreuzfahrten mit diesen Filtern gefunden.'}
        </p>
      </div>
      {onReset && (
        <button onClick={onReset} className="btn-secondary text-xs">
          Filter zurücksetzen
        </button>
      )}
    </div>
  );
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-900/20">
        <Ship className="w-10 h-10 text-red-400" />
      </div>
      <div>
        <p className="font-semibold text-red-700 dark:text-red-400">Fehler beim Laden</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
          {message ?? 'Bitte prüfe, ob die API läuft (http://localhost:3001).'}
        </p>
      </div>
    </div>
  );
}
