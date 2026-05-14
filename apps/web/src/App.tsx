import { useState } from 'react';
import { Anchor, BarChart3, Sun, Moon, Database } from 'lucide-react';
import { Dashboard } from './pages/Dashboard.tsx';
import { Sources } from './pages/Sources.tsx';
import { useTheme } from './hooks/useTheme.ts';
import clsx from 'clsx';

type Page = 'dashboard' | 'sources';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const { dark, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 text-ocean-600 dark:text-ocean-400 font-bold">
            <Anchor className="w-5 h-5" />
            <span className="hidden sm:inline">Cruise Deals</span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => setPage('dashboard')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                page === 'dashboard'
                  ? 'bg-ocean-50 dark:bg-ocean-950/50 text-ocean-700 dark:text-ocean-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Angebote</span>
            </button>
            <button
              onClick={() => setPage('sources')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                page === 'sources'
                  ? 'bg-ocean-50 dark:bg-ocean-950/50 text-ocean-700 dark:text-ocean-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Quellen</span>
            </button>
          </nav>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title={dark ? 'Light Mode' : 'Dark Mode'}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        {page === 'dashboard' ? <Dashboard /> : <Sources />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-12 py-4 text-center text-xs text-slate-400 dark:text-slate-600">
        Cruise Deals MVP · Preise ohne Gewähr · Nur öffentlich zugängliche Daten
      </footer>
    </div>
  );
}
