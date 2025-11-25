'use client';

import { SymbolSearch } from '@/components/controls/SymbolSearch';

interface TopBarProps {
  onSymbolSelect: (symbol: string) => void;
  onToggleTheme: () => void;
  theme: 'dark' | 'light';
}

export function TopBar({ onSymbolSelect, onToggleTheme, theme }: TopBarProps) {
  return (
    <header className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800/60 bg-slate-900/80 px-5 py-3 shadow-lg">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Atlas Terminal</h1>
        <p className="text-sm text-slate-400">Real-time charting and analytics environment</p>
      </div>
      <SymbolSearch onSelect={onSymbolSelect} />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleTheme}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-200 transition hover:border-accent hover:text-white"
        >
          Theme: {theme === 'dark' ? 'Dark' : 'Light'}
        </button>
      </div>
    </header>
  );
}
