'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { DEFAULT_SYMBOLS } from '@/lib/symbols';
import { CandleData } from '@/lib/types';

interface WatchlistProps {
  activeSymbol: string;
  onSelect: (symbol: string) => void;
}

async function fetchLastPrice(symbol: string): Promise<CandleData | null> {
  const params = new URLSearchParams({ symbol, interval: '1h', limit: '1' });
  const response = await fetch(`/api/klines?${params.toString()}`);
  if (!response.ok) return null;
  const payload = (await response.json()) as { candles: CandleData[] };
  return payload.candles.at(-1) ?? null;
}

export function Watchlist({ activeSymbol, onSelect }: WatchlistProps) {
  const { data } = useSWR(
    DEFAULT_SYMBOLS.map((item) => item.symbol),
    async () => {
      const entries = await Promise.all(
        DEFAULT_SYMBOLS.map(async (item) => ({
          symbol: item.symbol,
          info: item,
          last: await fetchLastPrice(item.symbol),
        })),
      );
      return entries;
    },
    {
      refreshInterval: 60_000,
    },
  );

  const rows = useMemo(() => data ?? [], [data]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800/60 bg-slate-900/80 p-3">
      <h3 className="text-sm font-semibold text-slate-200">Watchlist</h3>
      <div className="mt-3 flex-1 space-y-1 overflow-y-auto">
        {rows.map((row) => {
          const lastClose = row.last?.close ?? 0;
          const lastOpen = row.last?.open ?? lastClose;
          const change = lastClose && lastOpen ? ((lastClose - lastOpen) / lastOpen) * 100 : 0;
          const isActive = row.symbol === activeSymbol;
          return (
            <button
              key={row.symbol}
              type="button"
              onClick={() => onSelect(row.symbol)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${
                isActive ? 'bg-accent/20 text-white ring-1 ring-accent' : 'hover:bg-slate-800/70 text-slate-300'
              }`}
            >
              <div>
                <p className="text-sm font-medium">{row.symbol}</p>
                <p className="text-xs text-slate-400">{row.info.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {lastClose ? lastClose.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—'}
                </p>
                <p className={`text-xs ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {change >= 0 ? '+' : ''}
                  {change.toFixed(2)}%
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
