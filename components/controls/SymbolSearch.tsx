'use client';

import { useMemo, useState } from 'react';
import { DEFAULT_SYMBOLS } from '@/lib/symbols';

interface SymbolSearchProps {
  onSelect: (symbol: string) => void;
}

export function SymbolSearch({ onSelect }: SymbolSearchProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return DEFAULT_SYMBOLS.slice(0, 6);
    const normalized = query.trim().toUpperCase();
    return DEFAULT_SYMBOLS.filter(
      (item) =>
        item.symbol.includes(normalized) ||
        item.name.toUpperCase().includes(normalized),
    ).slice(0, 8);
  }, [query]);

  return (
    <div className="relative w-full max-w-xs">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search markets..."
        className="w-full rounded-lg border border-slate-700/60 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-accent focus:outline-none"
      />
      {filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-11 z-10 overflow-hidden rounded-lg border border-slate-800/80 bg-slate-900/95 shadow-xl">
          {filtered.map((item) => (
            <button
              key={item.symbol}
              type="button"
              onClick={() => {
                onSelect(item.symbol);
                setQuery('');
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800/70"
            >
              <span className="font-medium">{item.symbol}</span>
              <span className="text-xs text-slate-400">{item.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
